import os
import sys
from datetime import datetime, timedelta

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_path)

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.pet import Pet
from app.models.safe_zone import SafeZone
from app.models.location import PetLocation
from app.models.alert import Alert
from app.services.risk_service import compute_escape_risk

def seed_database():
    app = create_app("development")
    with app.app_context():
        print("[*] Seeding realistic academic demo data into MySQL database...")

        # 1. Ensure Demo User
        demo_user = User.query.filter_by(email="student@anurag.edu.in").first()
        if not demo_user:
            demo_user = User(
                name="Anurag Student",
                email="student@anurag.edu.in",
                phone="+91 98765 43210"
            )
            demo_user.set_password("Password123!")
            db.session.add(demo_user)
            db.session.flush()
            print(f"  Created student demo account: {demo_user.email} / Password123!")

        # 2. Add Pet 1: Buddy (Calm, safe dog near Anurag University campus)
        buddy = Pet.query.filter_by(user_id=demo_user.id, name="Buddy").first()
        if not buddy:
            buddy = Pet(
                user_id=demo_user.id,
                name="Buddy",
                species="Dog",
                breed="Golden Retriever",
                age=3,
                gender="Male",
                description="Friendly golden retriever with reflective blue collar."
            )
            db.session.add(buddy)
            db.session.flush()

            # Safe Zone: Campus central grounds
            sz_buddy = SafeZone(
                pet_id=buddy.id,
                center_latitude=17.420000,
                center_longitude=78.656000,
                radius_meters=100.0,
                is_active=True
            )
            db.session.add(sz_buddy)

            # Buddy's calm movement trajectory (safely inside)
            now = datetime.utcnow()
            buddy_points = [
                (17.420000, 78.656000, 0.0, True, now - timedelta(minutes=25)),
                (17.420100, 78.656050, 12.3, True, now - timedelta(minutes=20)),
                (17.420180, 78.656120, 23.8, True, now - timedelta(minutes=15)),
                (17.420120, 78.656080, 16.1, True, now - timedelta(minutes=10)),
                (17.420050, 78.656020, 6.2, True, now - timedelta(minutes=3)),
            ]
            for lat, lon, dist, inside, ts in buddy_points:
                loc = PetLocation(
                    pet_id=buddy.id,
                    latitude=lat,
                    longitude=lon,
                    distance_from_center=dist,
                    is_inside=inside,
                    is_simulated=True,
                    timestamp=ts
                )
                db.session.add(loc)

            db.session.commit()
            compute_escape_risk(buddy.id)
            print("  Created Pet 1: Buddy (Inside Safe Zone)")

        # 3. Add Pet 2: Luna (Active, adventurous Beagle with boundary crossings)
        luna = Pet.query.filter_by(user_id=demo_user.id, name="Luna").first()
        if not luna:
            luna = Pet(
                user_id=demo_user.id,
                name="Luna",
                species="Dog",
                breed="Beagle",
                age=2,
                gender="Female",
                description="Curious beagle prone to digging under fences."
            )
            db.session.add(luna)
            db.session.flush()

            # Safe Zone: Yard perimeter
            sz_luna = SafeZone(
                pet_id=luna.id,
                center_latitude=17.420500,
                center_longitude=78.655500,
                radius_meters=80.0,
                is_active=True
            )
            db.session.add(sz_luna)

            # Luna's movement points exhibiting boundary agitation and escape
            now = datetime.utcnow()
            luna_points = [
                (17.420500, 78.655500, 0.0, True, now - timedelta(minutes=35)),
                (17.420900, 78.655500, 44.4, True, now - timedelta(minutes=30)),
                (17.421150, 78.655500, 72.2, True, now - timedelta(minutes=20)),
                (17.421400, 78.655500, 100.0, False, now - timedelta(minutes=10)), # Breach!
                (17.421700, 78.655500, 133.3, False, now - timedelta(minutes=2)),  # Stray outside
            ]
            for lat, lon, dist, inside, ts in luna_points:
                loc = PetLocation(
                    pet_id=luna.id,
                    latitude=lat,
                    longitude=lon,
                    distance_from_center=dist,
                    is_inside=inside,
                    is_simulated=True,
                    timestamp=ts
                )
                db.session.add(loc)

            # Create Escape Alert for Luna
            alert = Alert(
                pet_id=luna.id,
                alert_type="ESCAPE",
                message=f"Escape Alert: Luna has crossed the safe zone boundary! Distance: 133.3m (53.3m outside perimeter).",
                latitude=17.421700,
                longitude=78.655500,
                distance_from_center=133.3,
                is_read=False,
                created_at=now - timedelta(minutes=2)
            )
            db.session.add(alert)

            db.session.commit()
            compute_escape_risk(luna.id)
            print("  Created Pet 2: Luna (Escaped outside safe zone + active alert created)")

        print("[SUCCESS] Demo seeding completed successfully! Ready for presentation.")

if __name__ == "__main__":
    seed_database()
