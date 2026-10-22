from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.utils.response import api_response, api_error
from app.utils.auth import verify_pet_ownership
from app.services.risk_service import compute_escape_risk

risk_bp = Blueprint("risk", __name__, url_prefix="/api/pets/<int:pet_id>/risk")


@risk_bp.route("", methods=["GET"])
@jwt_required()
def get_pet_risk(pet_id):
    user_id = int(get_jwt_identity())
    pet, err_msg, status_code = verify_pet_ownership(pet_id, user_id)
    if err_msg:
        return api_error(err_msg, status_code=status_code)

    try:
        assessment = compute_escape_risk(pet_id)
        return api_response(data=assessment, message="Escape risk assessment calculated.")
    except Exception as e:
        return api_error(f"Failed to calculate risk assessment: {str(e)}", status_code=500)
