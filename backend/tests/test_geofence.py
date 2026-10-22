import math
from app.services.geofence_service import haversine_distance, check_geofence


def test_haversine_distance_zero_for_same_point():
    """Distance between identical coordinates must be 0 meters."""
    dist = haversine_distance(17.4200, 78.6560, 17.4200, 78.6560)
    assert dist == 0.0


def test_haversine_distance_known_points():
    """Test distance between known points (Hyderabad to Secunderabad approximate ~8.5km)."""
    hyderabad_lat, hyderabad_lon = 17.3850, 78.4867
    secunderabad_lat, secunderabad_lon = 17.4399, 78.4983
    dist = haversine_distance(hyderabad_lat, hyderabad_lon, secunderabad_lat, secunderabad_lon)
    # Expected distance roughly 6200m - 6400m
    assert 6000.0 <= dist <= 6500.0


def test_check_geofence_inside():
    """A point 30m away from center with a 100m radius must be classified as inside."""
    center_lat, center_lon = 17.420000, 78.656000
    # 0.0002 degrees latitude is approximately 22.2 meters
    pet_lat, pet_lon = 17.420200, 78.656000
    result = check_geofence(pet_lat, pet_lon, center_lat, center_lon, radius_meters=100.0)

    assert result["is_inside"] is True
    assert result["distance_from_center"] < 100.0
    assert result["margin"] > 0.0  # Positive margin represents safety buffer


def test_check_geofence_outside():
    """A point 200m away with a 100m radius must be classified as outside."""
    center_lat, center_lon = 17.420000, 78.656000
    # 0.002 degrees latitude is approximately 222 meters
    pet_lat, pet_lon = 17.422000, 78.656000
    result = check_geofence(pet_lat, pet_lon, center_lat, center_lon, radius_meters=100.0)

    assert result["is_inside"] is False
    assert result["distance_from_center"] > 100.0
    assert result["margin"] < 0.0  # Negative margin indicates distance past perimeter
