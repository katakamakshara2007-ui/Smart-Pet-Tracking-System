from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.safe_zone import SafeZone
from app.models.location import PetLocation
from app.utils.response import api_response, api_error
from app.utils.auth import verify_pet_ownership
from app.utils.validators import is_valid_coordinate, is_valid_radius
from app.services.geofence_service import check_geofence

safe_zone_bp = Blueprint("safe_zones", __name__, url_prefix="/api/pets/<int:pet_id>/safezone")


@safe_zone_bp.route("", methods=["GET"])
@jwt_required()
def get_safe_zone(pet_id):
    user_id = int(get_jwt_identity())
    pet, err_msg, status_code = verify_pet_ownership(pet_id, user_id)
    if err_msg:
        return api_error(err_msg, status_code=status_code)

    safe_zone = SafeZone.query.filter_by(pet_id=pet_id, is_active=True).first()
    if not safe_zone:
        return api_response(data=None, message="No safe zone configured yet.")

    return api_response(data=safe_zone.to_dict(), message="Safe zone retrieved.")


@safe_zone_bp.route("", methods=["POST", "PUT"])
@jwt_required()
def set_safe_zone(pet_id):
    user_id = int(get_jwt_identity())
    pet, err_msg, status_code = verify_pet_ownership(pet_id, user_id)
    if err_msg:
        return api_error(err_msg, status_code=status_code)

    data = request.get_json() or {}
    center_lat = data.get("center_latitude")
    center_lon = data.get("center_longitude")
    radius = data.get("radius_meters")

    if center_lat is None or center_lon is None or radius is None:
        return api_error("center_latitude, center_longitude, and radius_meters are all required.", status_code=400)

    if not is_valid_coordinate(center_lat, center_lon):
        return api_error("Invalid coordinates. Latitude must be -90 to 90, Longitude -180 to 180.", status_code=400)

    if not is_valid_radius(radius):
        return api_error("Radius must be between 10 meters and 50,000 meters.", status_code=400)

    safe_zone = SafeZone.query.filter_by(pet_id=pet_id).first()
    if not safe_zone:
        safe_zone = SafeZone(pet_id=pet_id)
        db.session.add(safe_zone)

    safe_zone.center_latitude = float(center_lat)
    safe_zone.center_longitude = float(center_lon)
    safe_zone.radius_meters = float(radius)
    safe_zone.is_active = True

    # Re-evaluate latest pet location against the new safe zone configuration
    latest_loc = (
        PetLocation.query.filter_by(pet_id=pet_id)
        .order_by(PetLocation.timestamp.desc(), PetLocation.id.desc())
        .first()
    )
    if latest_loc:
        check = check_geofence(
            pet_lat=float(latest_loc.latitude),
            pet_lon=float(latest_loc.longitude),
            center_lat=float(safe_zone.center_latitude),
            center_lon=float(safe_zone.center_longitude),
            radius_meters=float(safe_zone.radius_meters),
        )
        latest_loc.distance_from_center = check["distance_from_center"]
        latest_loc.is_inside = check["is_inside"]

    db.session.commit()

    return api_response(
        data=safe_zone.to_dict(),
        message="Safe zone configuration updated successfully.",
    )
