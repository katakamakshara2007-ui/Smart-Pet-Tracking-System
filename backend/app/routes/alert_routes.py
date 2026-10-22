from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.pet import Pet
from app.models.alert import Alert
from app.utils.response import api_response, api_error
from app.utils.auth import verify_pet_ownership

alert_bp = Blueprint("alerts", __name__, url_prefix="/api/alerts")


@alert_bp.route("", methods=["GET"])
@jwt_required()
def get_user_alerts():
    user_id = int(get_jwt_identity())
    user_pet_ids = [p.id for p in Pet.query.filter_by(user_id=user_id).all()]

    if not user_pet_ids:
        return api_response(data=[], message="No alerts found.")

    unread_only = request.args.get("unread_only", "false").lower() == "true"
    pet_filter = request.args.get("pet_id", type=int)

    query = Alert.query.filter(Alert.pet_id.in_(user_pet_ids))
    if pet_filter and pet_filter in user_pet_ids:
        query = query.filter_by(pet_id=pet_filter)
    if unread_only:
        query = query.filter_by(is_read=False)

    alerts = query.order_by(Alert.created_at.desc()).limit(100).all()
    return api_response(data=[a.to_dict() for a in alerts], message="Alerts retrieved.")


@alert_bp.route("/pet/<int:pet_id>", methods=["GET"])
@jwt_required()
def get_pet_alerts(pet_id):
    user_id = int(get_jwt_identity())
    pet, err_msg, status_code = verify_pet_ownership(pet_id, user_id)
    if err_msg:
        return api_error(err_msg, status_code=status_code)

    alerts = Alert.query.filter_by(pet_id=pet_id).order_by(Alert.created_at.desc()).limit(100).all()
    return api_response(data=[a.to_dict() for a in alerts], message="Pet alerts retrieved.")


@alert_bp.route("/<int:alert_id>/read", methods=["PATCH", "PUT"])
@jwt_required()
def mark_alert_read(alert_id):
    user_id = int(get_jwt_identity())
    alert = db.session.get(Alert, alert_id)
    if not alert:
        return api_error("Alert not found.", status_code=404)

    # Verify ownership of the pet that triggered this alert
    pet = db.session.get(Pet, alert.pet_id)
    if not pet or pet.user_id != user_id:
        return api_error("Access denied.", status_code=403)

    alert.is_read = True
    db.session.commit()

    return api_response(data=alert.to_dict(), message="Alert marked as read.")


@alert_bp.route("/mark-all-read", methods=["POST", "PUT"])
@jwt_required()
def mark_all_alerts_read():
    user_id = int(get_jwt_identity())
    user_pet_ids = [p.id for p in Pet.query.filter_by(user_id=user_id).all()]

    if not user_pet_ids:
        return api_response(message="No alerts to mark as read.")

    updated_count = Alert.query.filter(
        Alert.pet_id.in_(user_pet_ids),
        Alert.is_read == False
    ).update({"is_read": True}, synchronize_session=False)

    db.session.commit()

    return api_response(message=f"Marked {updated_count} alert(s) as read.")


@alert_bp.route("/<int:alert_id>", methods=["DELETE"])
@jwt_required()
def delete_alert(alert_id):
    user_id = int(get_jwt_identity())
    alert = Alert.query.get(alert_id)
    if not alert:
        return api_error("Alert not found.", status_code=404)

    pet = Pet.query.get(alert.pet_id)
    if not pet or pet.user_id != user_id:
        return api_error("Access denied.", status_code=403)

    db.session.delete(alert)
    db.session.commit()
    return api_response(message="Alert deleted.")
