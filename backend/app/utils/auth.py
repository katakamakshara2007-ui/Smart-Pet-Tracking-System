from flask_jwt_extended import get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.models.pet import Pet


def get_current_user_record():
    """Retrieve the User model instance for the currently authenticated JWT identity."""
    identity = get_jwt_identity()
    if not identity:
        return None
    try:
        user_id = int(identity)
        return db.session.get(User, user_id)
    except (ValueError, TypeError):
        return None


def verify_pet_ownership(pet_id: int, user_id: int):
    """
    Check if a pet exists and strictly belongs to the given user ID.
    Enforces security isolation between students/users.
    
    :return: (pet_instance, error_message, status_code)
    """
    pet = db.session.get(Pet, pet_id)
    if not pet:
        return None, f"Pet with ID {pet_id} was not found.", 404

    if pet.user_id != user_id:
        return None, "Forbidden: You do not have permission to access or modify this pet's data.", 403

    return pet, None, 200
