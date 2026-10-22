import re


def is_valid_email(email: str) -> bool:
    """Validate RFC 5322 compatible email pattern."""
    if not email or not isinstance(email, str):
        return False
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return re.match(pattern, email.strip()) is not None


def is_valid_coordinate(latitude: float, longitude: float) -> bool:
    """Validate geographic latitude (-90 to 90) and longitude (-180 to 180)."""
    try:
        lat = float(latitude)
        lon = float(longitude)
        return -90.0 <= lat <= 90.0 and -180.0 <= lon <= 180.0
    except (ValueError, TypeError):
        return False


def is_valid_radius(radius: float) -> bool:
    """Validate safe zone radius in meters (10m to 50,000m)."""
    try:
        r = float(radius)
        return 10.0 <= r <= 50000.0
    except (ValueError, TypeError):
        return False
