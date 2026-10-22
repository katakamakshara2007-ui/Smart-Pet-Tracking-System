import json
from datetime import datetime
from app.extensions import db


class RiskAssessment(db.Model):
    __tablename__ = "risk_assessments"

    id = db.Column(db.Integer, primary_key=True)
    pet_id = db.Column(db.Integer, db.ForeignKey("pets.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_score = db.Column(db.Numeric(5, 2), nullable=False)
    risk_level = db.Column(db.String(25), nullable=False)
    factors_json = db.Column(db.Text, nullable=False)
    recommendations = db.Column(db.Text, nullable=True)
    assessed_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        factors = []
        if self.factors_json:
            try:
                factors = json.loads(self.factors_json)
            except Exception:
                factors = [self.factors_json]

        return {
            "id": self.id,
            "pet_id": self.pet_id,
            "risk_score": float(self.risk_score) if self.risk_score is not None else 0.0,
            "risk_level": self.risk_level,
            "factors": factors,
            "recommendations": self.recommendations,
            "assessed_at": self.assessed_at.isoformat() if self.assessed_at else None,
        }
