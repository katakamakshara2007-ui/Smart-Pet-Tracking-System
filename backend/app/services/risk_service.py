import json
from datetime import datetime
from app.extensions import db
from app.models.pet import Pet
from app.models.location import PetLocation
from app.models.safe_zone import SafeZone
from app.models.risk_assessment import RiskAssessment


def compute_escape_risk(pet_id: int) -> dict:
    """
    Calculate an explainable, heuristic escape-risk assessment for a pet.
    
    Academic Project Disclaimer:
    This algorithm uses an explainable rule-based heuristic scoring engine
    tailored for B.Tech Data Science demonstration. It evaluates boundary proximity,
    frequency of crossings, and movement vectors. It is not an unverified black-box ML model.
    """
    pet = db.session.get(Pet, pet_id)
    if not pet:
        raise ValueError(f"Pet with ID {pet_id} not found.")

    safe_zone = SafeZone.query.filter_by(pet_id=pet_id, is_active=True).first()
    radius = float(safe_zone.radius_meters) if safe_zone else 100.0

    # Retrieve last 15 locations chronologically descending
    locations = (
        PetLocation.query.filter_by(pet_id=pet_id)
        .order_by(PetLocation.timestamp.desc(), PetLocation.id.desc())
        .limit(15)
        .all()
    )

    total_points = len(locations)

    # Check for insufficient data (< 3 points)
    if total_points < 3:
        assessment_result = {
            "pet_id": pet_id,
            "pet_name": pet.name,
            "risk_score": 0.0,
            "risk_level": "INSUFFICIENT_DATA",
            "status_title": "Insufficient Data for Reliable Prediction",
            "factors": [
                f"Movement history contains only {total_points} point(s). A minimum of 3 consecutive GPS readings is required to compute trajectory dynamics.",
                "Simulate or record more movements using the Pet Tracking Map panel to generate predictive risk assessments."
            ],
            "recommendations": "Add simulated movements inside and near the safe zone to train trajectory tracking.",
            "data_points_count": total_points,
            "assessed_at": datetime.utcnow().isoformat(),
        }
        return assessment_result

    # Most recent point is locations[0]
    latest = locations[0]
    latest_dist = float(latest.distance_from_center)
    proximity_ratio = latest_dist / max(radius, 1.0)

    factors = []
    proximity_score = 0.0
    crossing_score = 0.0
    trajectory_score = 0.0

    # --- Factor 1: Perimeter Proximity (Max 40 points) ---
    if not latest.is_inside:
        proximity_score = 40.0
        factors.append(
            f"Perimeter Status: Pet is currently OUTSIDE the safe zone by {round(latest_dist - radius, 1)}m "
            f"(Distance: {latest_dist:.1f}m / Permitted: {radius:.1f}m). (+40 pts)"
        )
    elif proximity_ratio >= 0.85:
        proximity_score = 35.0
        factors.append(
            f"Perimeter Status: Pet is hovering at the perimeter edge ({round(proximity_ratio * 100)}% of safe radius). (+35 pts)"
        )
    elif proximity_ratio >= 0.65:
        proximity_score = 22.0
        factors.append(
            f"Perimeter Status: Pet is in intermediate zone ({round(proximity_ratio * 100)}% of safe radius). (+22 pts)"
        )
    elif proximity_ratio >= 0.40:
        proximity_score = 12.0
        factors.append(
            f"Perimeter Status: Pet is safely near the home center ({round(proximity_ratio * 100)}% of safe radius). (+12 pts)"
        )
    else:
        proximity_score = 5.0
        factors.append(
            f"Perimeter Status: Pet is closely centered at home base ({round(proximity_ratio * 100)}% of safe radius). (+5 pts)"
        )

    # --- Factor 2: Repeated Boundary Crossings (Max 35 points) ---
    # Count transitions between consecutive points in historical window
    # locations are in desc order: [newest, ..., oldest]
    chronological = list(reversed(locations))
    crossings_count = 0
    for i in range(1, len(chronological)):
        if chronological[i].is_inside != chronological[i - 1].is_inside:
            crossings_count += 1

    if crossings_count >= 3:
        crossing_score = 35.0
        factors.append(
            f"Boundary Stability: Frequent boundary transitions observed ({crossings_count} crossings in last {total_points} updates). High escape repetition risk. (+35 pts)"
        )
    elif crossings_count == 2:
        crossing_score = 25.0
        factors.append(
            f"Boundary Stability: Moderate boundary agitation ({crossings_count} boundary crossings recorded). (+25 pts)"
        )
    elif crossings_count == 1:
        crossing_score = 15.0
        factors.append(
            f"Boundary Stability: 1 boundary breach detected in recent history. (+15 pts)"
        )
    else:
        crossing_score = 0.0
        factors.append(
            "Boundary Stability: Zero boundary crossings in recorded movement history. Stable adherence. (+0 pts)"
        )

    # --- Factor 3: Movement Trajectory & Velocity (Max 25 points) ---
    # Compare recent 3 points: locations[2] -> locations[1] -> locations[0]
    p_old = locations[2]
    p_new = locations[0]
    delta_distance = float(p_new.distance_from_center) - float(p_old.distance_from_center)

    if delta_distance > 15.0:
        trajectory_score = 25.0
        factors.append(
            f"Trajectory Vector: Rapid outward movement detected (+{delta_distance:.1f}m away from center over last 3 updates). (+25 pts)"
        )
    elif delta_distance > 4.0:
        trajectory_score = 15.0
        factors.append(
            f"Trajectory Vector: Consistent outward trend (+{delta_distance:.1f}m towards safe-zone boundary). (+15 pts)"
        )
    elif delta_distance < -5.0:
        trajectory_score = 0.0
        factors.append(
            f"Trajectory Vector: Pet is moving inward towards center ({abs(delta_distance):.1f}m inward retreat). (+0 pts)"
        )
    else:
        trajectory_score = 5.0
        factors.append(
            "Trajectory Vector: Stationary / localized wandering with minimal directional momentum. (+5 pts)"
        )

    # Total Score Calculation (Clamped 0.0 - 100.0)
    raw_score = proximity_score + crossing_score + trajectory_score
    risk_score = round(min(100.0, max(0.0, raw_score)), 1)

    # Classify Risk Level
    if risk_score <= 35.0:
        risk_level = "LOW"
        status_title = "Low Escape Risk"
        recommendations = "Pet exhibits calm movement inside the designated safe zone. Normal monitoring is adequate."
    elif risk_score <= 70.0:
        risk_level = "MEDIUM"
        status_title = "Moderate Escape Risk"
        recommendations = "Pet is drifting towards boundary edges or wandering. Keep an eye on gates and outdoor activity."
    else:
        risk_level = "HIGH"
        status_title = "High Escape Risk"
        recommendations = "Urgent: Pet is beyond or rapidly approaching the boundary perimeter. Inspect physical enclosures immediately."

    # Persist RiskAssessment record in database
    assessment_record = RiskAssessment(
        pet_id=pet_id,
        risk_score=risk_score,
        risk_level=risk_level,
        factors_json=json.dumps(factors),
        recommendations=recommendations,
        assessed_at=datetime.utcnow(),
    )
    db.session.add(assessment_record)
    db.session.commit()

    return {
        "pet_id": pet_id,
        "pet_name": pet.name,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "status_title": status_title,
        "factors": factors,
        "recommendations": recommendations,
        "data_points_count": total_points,
        "proximity_score": proximity_score,
        "crossing_score": crossing_score,
        "trajectory_score": trajectory_score,
        "assessed_at": assessment_record.assessed_at.isoformat(),
    }
