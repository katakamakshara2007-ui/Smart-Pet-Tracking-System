import pytest
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.pet import Pet
from app.models.safe_zone import SafeZone


@pytest.fixture
def app():
    """Create application configured for testing with in-memory SQLite database."""
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Test HTTP client."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Test CLI runner."""
    return app.test_cli_runner()


@pytest.fixture
def auth_headers(client):
    """Helper fixture to register and log in a primary user, returning JWT headers."""
    client.post(
        "/api/auth/register",
        json={
            "name": "Anurag Student",
            "email": "student@anurag.edu.in",
            "password": "Password123!",
            "phone": "+919876543210",
        },
    )
    res = client.post(
        "/api/auth/login",
        json={
            "email": "student@anurag.edu.in",
            "password": "Password123!",
        },
    )
    token = res.get_json()["data"]["token"]
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


@pytest.fixture
def secondary_auth_headers(client):
    """Helper fixture to register a second user to test security isolation."""
    client.post(
        "/api/auth/register",
        json={
            "name": "Second User",
            "email": "second@anurag.edu.in",
            "password": "Password123!",
            "phone": "+919876543211",
        },
    )
    res = client.post(
        "/api/auth/login",
        json={
            "email": "second@anurag.edu.in",
            "password": "Password123!",
        },
    )
    token = res.get_json()["data"]["token"]
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
