import os
import logging
from flask import Flask, jsonify
from app.config import config_by_name
from app.extensions import db, jwt, cors
from app.routes import (
    auth_bp,
    pet_bp,
    safe_zone_bp,
    tracking_bp,
    alert_bp,
    risk_bp,
    dashboard_bp,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
)
logger = logging.getLogger(__name__)


def create_app(config_name=None):
    """
    Application Factory for Smart Pet Tracking and Escape Prediction System.
    B.Tech Data Science Project - Anurag University.
    """
    app = Flask(__name__)

    # Determine configuration mode
    if config_name is None:
        env_mode = os.getenv("FLASK_ENV", "development").lower()
        config_name = env_mode if env_mode in config_by_name else "default"

    app.config.from_object(config_by_name[config_name])

    # Initialize extensions
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": "*"}},
        supports_credentials=True,
    )
    db.init_app(app)
    jwt.init_app(app)

    # JWT Error handlers for clean API responses
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "success": False,
            "message": "Authentication token has expired. Please log in again.",
            "error": "token_expired"
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({
            "success": False,
            "message": "Invalid authentication token signature.",
            "error": "invalid_token"
        }), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            "success": False,
            "message": "Authorization header with Bearer token is required.",
            "error": "authorization_required"
        }), 401

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(pet_bp)
    app.register_blueprint(safe_zone_bp)
    app.register_blueprint(tracking_bp)
    app.register_blueprint(alert_bp)
    app.register_blueprint(risk_bp)
    app.register_blueprint(dashboard_bp)

    # Root health and metadata endpoint
    @app.route("/", methods=["GET"])
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "system": "Smart Pet Tracking and Escape Prediction System",
            "version": "1.0.0",
            "institution": "Anurag University",
            "department": "Department of Data Science",
            "database_engine": app.config.get("SQLALCHEMY_DATABASE_URI", "").split(":")[0],
            "endpoints": {
                "auth": "/api/auth",
                "pets": "/api/pets",
                "tracking": "/api/pets/<id>/location",
                "safe_zone": "/api/pets/<id>/safezone",
                "alerts": "/api/alerts",
                "risk": "/api/pets/<id>/risk",
                "dashboard": "/api/dashboard/stats",
            }
        }), 200

    # Ensure tables exist (graceful fallback if MySQL is being set up)
    with app.app_context():
        try:
            db.create_all()
            logger.info("Database tables verified successfully.")
        except Exception as ex:
            logger.warning(
                f"Notice: Initial db.create_all() deferred or MySQL not yet initialized: {ex}. "
                "Ensure MySQL database 'smart_pet_tracking' is created or configure .env."
            )

    return app
