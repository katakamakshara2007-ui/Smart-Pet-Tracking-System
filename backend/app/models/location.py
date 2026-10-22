from datetime import datetime
from app.extensions import db


class PetLocation(db.Model):
    __tablename__ = "pet_locations"

    id = db.Column(db.Integer, primary_key=True)
    pet_id = db.Column(db.Integer, db.ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True)
    latitude = db.Column(db.Numeric(10, 8), nullable=False)
    longitude = db.Column(db.Numeric(11, 8), nullable=False)
    distance_from_center = db.Column(db.Numeric(8, 2), nullable=False)
    is_inside = db.Column(db.Boolean, nullable=False)
    is_simulated = db.Column(db.Boolean, default=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "pet_id": self.pet_id,
            "latitude": float(self.latitude) if self.latitude is not None else None,
            "longitude": float(self.longitude) if self.longitude is not None else None,
            "distance_from_center": float(self.distance_from_center) if self.distance_from_center is not None else 0.0,
            "is_inside": self.is_inside,
            "is_simulated": self.is_simulated,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
