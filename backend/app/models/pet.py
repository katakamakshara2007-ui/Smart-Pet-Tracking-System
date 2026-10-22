from datetime import datetime
from app.extensions import db


class Pet(db.Model):
    __tablename__ = "pets"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    species = db.Column(db.String(50), nullable=False)
    breed = db.Column(db.String(100), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(20), nullable=True)
    photo_url = db.Column(db.String(500), nullable=True)
    description = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    safe_zone = db.relationship("SafeZone", backref="pet", uselist=False, cascade="all, delete-orphan")
    locations = db.relationship("PetLocation", backref="pet", lazy="dynamic", cascade="all, delete-orphan", order_by="desc(PetLocation.timestamp)")
    alerts = db.relationship("Alert", backref="pet", lazy="dynamic", cascade="all, delete-orphan", order_by="desc(Alert.created_at)")
    risk_assessments = db.relationship("RiskAssessment", backref="pet", lazy="dynamic", cascade="all, delete-orphan", order_by="desc(RiskAssessment.assessed_at)")

    def to_dict(self, include_latest_location=True):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "species": self.species,
            "breed": self.breed,
            "age": self.age,
            "gender": self.gender,
            "photo_url": self.photo_url,
            "description": self.description,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "safe_zone": self.safe_zone.to_dict() if self.safe_zone else None,
        }

        if include_latest_location:
            latest_loc = self.locations.first()
            data["latest_location"] = latest_loc.to_dict() if latest_loc else None
            data["status"] = (
                "INSIDE" if latest_loc and latest_loc.is_inside
                else "OUTSIDE" if latest_loc and not latest_loc.is_inside
                else "UNKNOWN"
            )

        return data
