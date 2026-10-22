import math

# Mean Earth radius in meters (WGS84 standard spherical approximation)
EARTH_RADIUS_METERS = 6371000.0


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth 
    using the Haversine formula.

    :param lat1: Latitude of point 1 in degrees
    :param lon1: Longitude of point 1 in degrees
    :param lat2: Latitude of point 2 in degrees
    :param lon2: Longitude of point 2 in degrees
    :return: Distance in meters (float rounded to 2 decimal places)
    """
    if lat1 == lat2 and lon1 == lon2:
        return 0.0

    # Convert decimal degrees to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Haversine formula
    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    
    # Clamp value to [0, 1] to avoid float precision domain errors in asin/atan2
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = EARTH_RADIUS_METERS * c

    return round(distance, 2)


def check_geofence(
    pet_lat: float,
    pet_lon: float,
    center_lat: float,
    center_lon: float,
    radius_meters: float,
) -> dict:
    """
    Determine whether a pet's coordinate is inside or outside the defined safe zone.

    :param pet_lat: Current pet latitude
    :param pet_lon: Current pet longitude
    :param center_lat: Safe zone center latitude
    :param center_lon: Safe zone center longitude
    :param radius_meters: Permitted safe zone radius in meters
    :return: Dictionary containing distance, is_inside flag, and boundary margin
    """
    distance = haversine_distance(pet_lat, lon1=pet_lon, lat2=center_lat, lon2=center_lon)
    is_inside = distance <= radius_meters
    margin = round(radius_meters - distance, 2)

    return {
        "is_inside": is_inside,
        "distance_from_center": distance,
        "radius_meters": radius_meters,
        "margin": margin,  # Positive: inside safety margin; Negative: meters outside
    }
