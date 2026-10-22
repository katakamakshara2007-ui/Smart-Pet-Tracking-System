from app.routes.auth_routes import auth_bp
from app.routes.pet_routes import pet_bp
from app.routes.safe_zone_routes import safe_zone_bp
from app.routes.tracking_routes import tracking_bp
from app.routes.alert_routes import alert_bp
from app.routes.risk_routes import risk_bp
from app.routes.dashboard_routes import dashboard_bp

__all__ = [
    "auth_bp",
    "pet_bp",
    "safe_zone_bp",
    "tracking_bp",
    "alert_bp",
    "risk_bp",
    "dashboard_bp",
]
