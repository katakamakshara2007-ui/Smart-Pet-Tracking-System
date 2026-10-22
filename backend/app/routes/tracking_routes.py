from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.location import PetLocation
from app.utils.response import api_response, api_error
from app.utils.auth import verify_pet_ownership
from app.utils.validators import is_valid_coordinate
from app.services.tracking_service import process_location_update

tracking_bp = Blueprint("tracking", __name__, url_prefix="/api/pets/<int:pet_id>/location")


@tracking_bp.route("", methods=["POST"])
@jwt_required()
def record_location(pet_id):
    user_id = int(get_jwt_identity())
    pet, err_msg, status_code = verify_pet_ownership(pet_id, user_id)
    if err_msg:
        return api_error(err_msg, status_code=status_code)

    data = request.get_json() or {}
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    is_simulated = data.get("is_simulated", True)

    if latitude is None or longitude is None:
        return api_error("latitude and longitude are required.", status_code=400)

    if not is_valid_coordinate(latitude, longitude):
        return api_error("Coordinates are out of valid range (-90 to 90, -180 to 180).", status_code=400)

    try:
        result = process_location_update(
            pet_id=pet_id,
            latitude=float(latitude),
            longitude=float(longitude),
            is_simulated=bool(is_simulated),
        )
        return api_response(
            data=result,
            message="Location recorded successfully.",
            status_code=201,
        )
    except Exception as e:
        return api_error(f"Failed to process location: {str(e)}", status_code=500)


@tracking_bp.route("/latest", methods=["GET"])
@jwt_required()
def get_latest_location(pet_id):
    user_id = int(get_jwt_identity())
    pet, err_msg, status_code = verify_pet_ownership(pet_id, user_id)
    if err_msg:
        return api_error(err_msg, status_code=status_code)

    latest_loc = (
        PetLocation.query.filter_by(pet_id=pet_id)
        .order_by(PetLocation.timestamp.desc(), PetLocation.id.desc())
        .first()
    )

    if not latest_loc:
        return api_response(data=None, message="No location data recorded yet for this pet.")

    safe_zone = pet.safe_zone
    return api_response(
        data={
            "location": latest_loc.to_dict(),
            "safe_zone": safe_zone.to_dict() if safe_zone else None,
            "pet_name": pet.name,
        },
        message="Latest location retrieved.",
    )


@tracking_bp.route("/history", methods=["GET"])
@jwt_required()
def get_location_history(pet_id):
    user_id = int(get_jwt_identity())
    pet, err_msg, status_code = verify_pet_ownership(pet_id, user_id)
    if err_msg:
        return api_error(err_msg, status_code=status_code)

    limit = request.args.get("limit", default=100, type=int)
    limit = min(max(1, limit), 500)  # Bound between 1 and 500 records

    locations = (
        PetLocation.query.filter_by(pet_id=pet_id)
        .order_by(PetLocation.timestamp.desc(), PetLocation.id.desc())
        .limit(limit)
        .all()
    )

    return api_response(
        data=[loc.to_dict() for loc in locations],
        message=f"Retrieved {len(locations)} movement history record(s).",
    )


@tracking_bp.route("/history", methods=["DELETE"])
@jwt_required()
def clear_location_history(pet_id):
    user_id = int(get_jwt_identity())
    pet, err_msg, status_code = verify_pet_ownership(pet_id, user_id)
    if err_msg:
        return api_error(err_msg, status_code=status_code)

    deleted_count = PetLocation.query.filter_by(pet_id=pet_id).delete()
    db.session.commit()

    return api_response(message=f"Cleared {deleted_count} location history record(s).")
