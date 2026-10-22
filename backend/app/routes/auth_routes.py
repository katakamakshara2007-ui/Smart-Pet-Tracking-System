from flask import Blueprint, request
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.utils.response import api_response, api_error
from app.utils.validators import is_valid_email

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    phone = data.get("phone", "").strip()

    if not name:
        return api_error("Full name is required.", status_code=400)
    if not is_valid_email(email):
        return api_error("A valid email address is required.", status_code=400)
    if not password or len(password) < 6:
        return api_error("Password must be at least 6 characters long.", status_code=400)

    if User.query.filter_by(email=email).first():
        return api_error("An account with this email already exists.", status_code=409)

    user = User(name=name, email=email, phone=phone if phone else None)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    # Generate JWT token with user id as string identity
    access_token = create_access_token(identity=str(user.id))

    return api_response(
        data={"user": user.to_dict(), "token": access_token},
        message="Registration successful. Welcome to Smart Pet Tracking!",
        status_code=201,
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return api_error("Email and password are both required.", status_code=400)

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return api_error("Invalid email or password.", status_code=401)

    access_token = create_access_token(identity=str(user.id))

    return api_response(
        data={"user": user.to_dict(), "token": access_token},
        message="Login successful.",
        status_code=200,
    )


@auth_bp.route("/profile", methods=["GET"])
@jwt_required()
def get_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return api_error("User not found.", status_code=404)

    total_pets = user.pets.count()
    return api_response(
        data={
            "user": user.to_dict(),
            "stats": {"total_pets": total_pets},
            "project_info": {
                "system": "Smart Pet Tracking and Escape Prediction System",
                "institution": "Anurag University",
                "department": "Department of Data Science",
                "project_type": "B.Tech Final Year Capstone Project",
            },
        },
        message="User profile fetched.",
    )


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if not user:
        return api_error("User not found.", status_code=404)

    data = request.get_json() or {}
    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()
    new_password = data.get("new_password", "")

    if name:
        user.name = name
    if phone is not None:
        user.phone = phone

    if new_password:
        if len(new_password) < 6:
            return api_error("New password must be at least 6 characters.", status_code=400)
        user.set_password(new_password)

    db.session.commit()
    return api_response(data={"user": user.to_dict()}, message="Profile updated successfully.")
