from datetime import datetime
from app.extensions import db
from app.models.pet import Pet
from app.models.location import PetLocation
from app.models.alert import Alert
from app.models.safe_zone import SafeZone
from app.services.geofence_service import check_geofence


def process_location_update(
    pet_id: int,
    latitude: float,
    longitude: float,
    is_simulated: bool = True,
    timestamp: datetime = None,
) -> dict:
    """
    Process incoming GPS coordinate (simulated or hardware):
    1. Look up pet and its safe zone.
    2. Compute distance from safe zone center using Haversine formula.
    3. Evaluate boundary status (inside vs outside).
    4. Detect state transitions (inside -> outside triggers an escape alert).
       Prevents spamming duplicate alerts if pet remains outside.
    5. Save location history in database.
    """
    pet = db.session.get(Pet, pet_id)
    if not pet:
        raise ValueError(f"Pet with ID {pet_id} not found.")

    # Get active safe zone or default to pet's initial location if none configured
    safe_zone = SafeZone.query.filter_by(pet_id=pet_id, is_active=True).first()

    if not safe_zone:
        # If safe zone doesn't exist yet, auto-create one centered at this first coordinate
        # with default 100m radius so tracking can function immediately
        safe_zone = SafeZone(
            pet_id=pet_id,
            center_latitude=latitude,
            center_longitude=longitude,
            radius_meters=100.0,
            is_active=True,
        )
        db.session.add(safe_zone)
        db.session.flush()

    # Determine boundary check
    geofence_result = check_geofence(
        pet_lat=latitude,
        pet_lon=longitude,
        center_lat=float(safe_zone.center_latitude),
        center_lon=float(safe_zone.center_longitude),
        radius_meters=float(safe_zone.radius_meters),
    )

    distance = geofence_result["distance_from_center"]
    is_inside = geofence_result["is_inside"]
    margin = geofence_result["margin"]

    # Retrieve most recent prior location to detect state transitions
    last_location = (
        PetLocation.query.filter_by(pet_id=pet_id)
        .order_by(PetLocation.timestamp.desc(), PetLocation.id.desc())
        .first()
    )

    alert_created = None
    state_transition = "NO_CHANGE"

    # State Machine Logic:
    if last_location is None:
        # Initial reading
        if not is_inside:
            # Started outside safe zone
            state_transition = "INITIAL_BREACH"
            alert = Alert(
                pet_id=pet_id,
                alert_type="ESCAPE",
                message=f"Escape Alert: {pet.name} is outside safe zone ({distance}m from center, {abs(margin):.1f}m beyond boundary).",
                latitude=latitude,
                longitude=longitude,
                distance_from_center=distance,
                is_read=False,
            )
            db.session.add(alert)
            alert_created = alert
    else:
        was_inside = last_location.is_inside

        # Case 1: INSIDE -> OUTSIDE (State Transition: Trigger Escape Alert)
        if was_inside and not is_inside:
            state_transition = "ESCAPED"
            alert = Alert(
                pet_id=pet_id,
                alert_type="ESCAPE",
                message=f"Escape Alert: {pet.name} has crossed the safe zone boundary! Distance: {distance}m ({abs(margin):.1f}m outside perimeter).",
                latitude=latitude,
                longitude=longitude,
                distance_from_center=distance,
                is_read=False,
            )
            db.session.add(alert)
            alert_created = alert

        # Case 2: OUTSIDE -> INSIDE (State Transition: Pet returned to safety)
        elif not was_inside and is_inside:
            state_transition = "RETURNED"
            alert = Alert(
                pet_id=pet_id,
                alert_type="RETURN",
                message=f"Safe Return: {pet.name} has re-entered the safe zone ({distance}m from center).",
                latitude=latitude,
                longitude=longitude,
                distance_from_center=distance,
                is_read=False,
            )
            db.session.add(alert)
            alert_created = alert

        # Case 3: OUTSIDE -> OUTSIDE (Pet remains outside; DO NOT create duplicate alert)
        elif not was_inside and not is_inside:
            state_transition = "STILL_OUTSIDE"

        # Case 4: INSIDE -> INSIDE (Pet remains safely inside)
        else:
            state_transition = "STILL_INSIDE"

    # Create new location record
    new_loc = PetLocation(
        pet_id=pet_id,
        latitude=latitude,
        longitude=longitude,
        distance_from_center=distance,
        is_inside=is_inside,
        is_simulated=is_simulated,
        timestamp=timestamp or datetime.utcnow(),
    )
    db.session.add(new_loc)
    db.session.commit()

    return {
        "location": new_loc.to_dict(),
        "safe_zone": safe_zone.to_dict(),
        "is_inside": is_inside,
        "distance_from_center": distance,
        "margin": margin,
        "state_transition": state_transition,
        "alert_created": alert_created.to_dict() if alert_created else None,
    }
