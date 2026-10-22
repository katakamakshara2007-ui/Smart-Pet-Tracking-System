from flask import Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.pet import Pet
from app.models.alert import Alert
from app.utils.response import api_response

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_dashboard_summary():
    user_id = int(get_jwt_identity())
    pets = Pet.query.filter_by(user_id=user_id, is_active=True).all()
    user_pet_ids = [p.id for p in pets]

    total_pets = len(pets)
    pets_inside = 0
    pets_outside = 0
    pets_unknown = 0
    pet_cards = []

    for pet in pets:
        pet_dict = pet.to_dict()
        status = pet_dict.get("status", "UNKNOWN")
        if status == "INSIDE":
            pets_inside += 1
        elif status == "OUTSIDE":
            pets_outside += 1
        else:
            pets_unknown += 1

        pet_cards.append({
            "id": pet.id,
            "name": pet.name,
            "species": pet.species,
            "breed": pet.breed,
            "age": pet.age,
            "gender": pet.gender,
            "status": status,
            "photo_url": pet.photo_url,
            "safe_zone": pet_dict.get("safe_zone"),
            "latest_location": pet_dict.get("latest_location"),
        })

    # Unread and recent alerts
    active_alerts_count = 0
    recent_alerts = []
    if user_pet_ids:
        active_alerts_count = Alert.query.filter(
            Alert.pet_id.in_(user_pet_ids),
            Alert.is_read == False
        ).count()

        recent_alerts_records = (
            Alert.query.filter(Alert.pet_id.in_(user_pet_ids))
            .order_by(Alert.created_at.desc())
            .limit(5)
            .all()
        )
        recent_alerts = [a.to_dict() for a in recent_alerts_records]

    return api_response(
        data={
            "summary": {
                "total_pets": total_pets,
                "pets_inside": pets_inside,
                "pets_outside": pets_outside,
                "pets_unknown": pets_unknown,
                "active_alerts": active_alerts_count,
            },
            "pets": pet_cards,
            "recent_alerts": recent_alerts,
        },
        message="Dashboard summary retrieved.",
    )
