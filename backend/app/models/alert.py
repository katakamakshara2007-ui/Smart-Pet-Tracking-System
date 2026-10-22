from datetime import datetime
from app.extensions import db


class Alert(db.Model):
    __tablename__ = "alerts"

    id = db.Column(db.Integer, primary_key=True)
    pet_id = db.Column(db.Integer, db.ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = db.Column(db.String(50), nullable=False, default="ESCAPE")
    message = db.Column(db.Text, nullable=False)
    latitude = db.Column(db.Numeric(10, 8), nullable=False)
    longitude = db.Column(db.Numeric(11, 8), nullable=False)
    distance_from_center = db.Column(db.Numeric(8, 2), nullable=False)
    is_read = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "pet_id": self.pet_id,
            "pet_name": self.pet.name if self.pet else "Unknown Pet",
            "alert_type": self.alert_type,
            "message": self.message,
            "latitude": float(self.latitude) if self.latitude is not None else None,
            "longitude": float(self.longitude) if self.longitude is not None else None,
            "distance_from_center": float(self.distance_from_center) if self.distance_from_center is not None else 0.0,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
