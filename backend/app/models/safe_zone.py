from datetime import datetime
from app.extensions import db


class SafeZone(db.Model):
    __tablename__ = "safe_zones"

    id = db.Column(db.Integer, primary_key=True)
    pet_id = db.Column(db.Integer, db.ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    center_latitude = db.Column(db.Numeric(10, 8), nullable=False)
    center_longitude = db.Column(db.Numeric(11, 8), nullable=False)
    radius_meters = db.Column(db.Numeric(8, 2), nullable=False, default=100.0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "pet_id": self.pet_id,
            "center_latitude": float(self.center_latitude) if self.center_latitude is not None else None,
            "center_longitude": float(self.center_longitude) if self.center_longitude is not None else None,
            "radius_meters": float(self.radius_meters) if self.radius_meters is not None else 100.0,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
