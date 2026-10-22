from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.pet import Pet
from app.models.safe_zone import SafeZone
from app.models.location import PetLocation
from app.utils.response import api_response, api_error
from app.utils.auth import verify_pet_ownership

pet_bp = Blueprint("pets", __name__, url_prefix="/api/pets")

# Default coordinates near Anurag University campus / Hyderabad for initial setup
DEFAULT_LATITUDE = 17.420000
DEFAULT_LONGITUDE = 78.656000
DEFAULT_RADIUS = 100.0


@pet_bp.route("", methods=["GET"])
@jwt_required()
def list_pets():
    user_id = int(get_jwt_identity())
    pets = Pet.query.filter_by(user_id=user_id, is_active=True).order_by(Pet.created_at.desc()).all()
    return api_response(
        data=[pet.to_dict() for pet in pets],
        message="Pets retrieved successfully.",
    )


@pet_bp.route("", methods=["POST"])
@jwt_required()
def create_pet():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    species = data.get("species", "").strip()
    breed = data.get("breed", "").strip()
    age = data.get("age")
    gender = data.get("gender", "").strip()
    photo_url = data.get("photo_url", "").strip()
    description = data.get("description", "").strip()

    if not name:
        return api_error("Pet name is required.", status_code=400)
    if not species:
        return api_error("Pet species is required (e.g., Dog, Cat).", status_code=400)

    try:
        age_int = int(age) if age is not None and str(age).strip() != "" else None
    except ValueError:
        return api_error("Age must be a valid integer number of years.", status_code=400)

    pet = Pet(
        user_id=user_id,
        name=name,
        species=species,
        breed=breed if breed else None,
        age=age_int,
        gender=gender if gender else None,
        photo_url=photo_url if photo_url else None,
        description=description if description else None,
        is_active=True,
    )
    db.session.add(pet)
    db.session.flush()

    # Configure initial SafeZone (custom or sensible defaults)
    center_lat = data.get("center_latitude", DEFAULT_LATITUDE)
    center_lon = data.get("center_longitude", DEFAULT_LONGITUDE)
    radius = data.get("radius_meters", DEFAULT_RADIUS)

    safe_zone = SafeZone(
        pet_id=pet.id,
        center_latitude=float(center_lat),
        center_longitude=float(center_lon),
        radius_meters=float(radius),
        is_active=True,
    )
    db.session.add(safe_zone)

    # Initial location at safe zone center
    initial_location = PetLocation(
        pet_id=pet.id,
        latitude=float(center_lat),
        longitude=float(center_lon),
        distance_from_center=0.0,
        is_inside=True,
        is_simulated=True,
    )
    db.session.add(initial_location)

    db.session.commit()

    return api_response(
        data=pet.to_dict(),
        message=f"Pet '{pet.name}' registered successfully with initial safe zone.",
        status_code=201,
    )


@pet_bp.route("/<int:pet_id>", methods=["GET"])
@jwt_required()
def get_pet(pet_id):
    user_id = int(get_jwt_identity())
    pet, err_msg, status_code = verify_pet_ownership(pet_id, user_id)
    if err_msg:
        return api_error(err_msg, status_code=status_code)

    return api_response(data=pet.to_dict(), message="Pet details retrieved.")


@pet_bp.route("/<int:pet_id>", methods=["PUT"])
@jwt_required()
def update_pet(pet_id):
    user_id = int(get_jwt_identity())
    pet, err_msg, status_code = verify_pet_ownership(pet_id, user_id)
    if err_msg:
        return api_error(err_msg, status_code=status_code)

    data = request.get_json() or {}
    if "name" in data and data["name"].strip():
        pet.name = data["name"].strip()
    if "species" in data and data["species"].strip():
        pet.species = data["species"].strip()
    if "breed" in data:
        pet.breed = data["breed"].strip() or None
    if "age" in data:
        try:
            pet.age = int(data["age"]) if str(data["age"]).strip() != "" else None
        except ValueError:
            return api_error("Age must be an integer.", status_code=400)
    if "gender" in data:
        pet.gender = data["gender"].strip() or None
    if "photo_url" in data:
        pet.photo_url = data["photo_url"].strip() or None
    if "description" in data:
        pet.description = data["description"].strip() or None

    db.session.commit()
    return api_response(data=pet.to_dict(), message="Pet updated successfully.")


@pet_bp.route("/<int:pet_id>", methods=["DELETE"])
@jwt_required()
def delete_pet(pet_id):
    user_id = int(get_jwt_identity())
    pet, err_msg, status_code = verify_pet_ownership(pet_id, user_id)
    if err_msg:
        return api_error(err_msg, status_code=status_code)

    pet_name = pet.name
    db.session.delete(pet)
    db.session.commit()
    return api_response(message=f"Pet '{pet_name}' and all associated tracking data deleted.")
