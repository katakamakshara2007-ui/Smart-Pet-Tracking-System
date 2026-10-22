def test_risk_insufficient_data(client, auth_headers):
    """When fewer than 3 location points exist, risk assessment must report insufficient data."""
    pet_res = client.post(
        "/api/pets",
        json={"name": "Rocky", "species": "Dog", "center_latitude": 17.42, "center_longitude": 78.65, "radius_meters": 100},
        headers=auth_headers,
    )
    pet_id = pet_res.get_json()["data"]["id"]

    # Clear initial seed point to leave 0 points
    client.delete(f"/api/pets/{pet_id}/location/history", headers=auth_headers)

    # Add only 1 point
    client.post(
        f"/api/pets/{pet_id}/location",
        json={"latitude": 17.4200, "longitude": 78.6500, "is_simulated": True},
        headers=auth_headers,
    )

    risk_res = client.get(f"/api/pets/{pet_id}/risk", headers=auth_headers)
    assert risk_res.status_code == 200
    data = risk_res.get_json()["data"]

    assert data["risk_level"] == "INSUFFICIENT_DATA"
    assert "Insufficient Data" in data["status_title"]
    assert len(data["factors"]) > 0


def test_risk_low_risk_scenario(client, auth_headers):
    """Pet safely staying near center must evaluate to LOW risk."""
    pet_res = client.post(
        "/api/pets",
        json={"name": "Luna", "species": "Dog", "center_latitude": 17.4200, "center_longitude": 78.6560, "radius_meters": 100},
        headers=auth_headers,
    )
    pet_id = pet_res.get_json()["data"]["id"]

    # Post 4 points very close to center (within 10-20 meters)
    points = [
        {"latitude": 17.42001, "longitude": 78.65601},
        {"latitude": 17.42002, "longitude": 78.65602},
        {"latitude": 17.42001, "longitude": 78.65600},
        {"latitude": 17.42000, "longitude": 78.65600},
    ]
    for pt in points:
        client.post(f"/api/pets/{pet_id}/location", json=pt, headers=auth_headers)

    risk_res = client.get(f"/api/pets/{pet_id}/risk", headers=auth_headers)
    assert risk_res.status_code == 200
    data = risk_res.get_json()["data"]

    assert data["risk_level"] == "LOW"
    assert data["risk_score"] <= 35.0
    assert len(data["factors"]) >= 3


def test_risk_high_risk_scenario(client, auth_headers):
    """Pet repeatedly breaching perimeter and moving outwards must evaluate to HIGH risk."""
    pet_res = client.post(
        "/api/pets",
        json={"name": "Hunter", "species": "Dog", "center_latitude": 17.4200, "center_longitude": 78.6560, "radius_meters": 100},
        headers=auth_headers,
    )
    pet_id = pet_res.get_json()["data"]["id"]

    # Post points moving rapidly outwards across boundary
    points = [
        {"latitude": 17.42000, "longitude": 78.6560},  # Inside at center (0m)
        {"latitude": 17.42150, "longitude": 78.6560},  # Outside (~166m)
        {"latitude": 17.42080, "longitude": 78.6560},  # Inside boundary (~88m)
        {"latitude": 17.42250, "longitude": 78.6560},  # Outside boundary (~277m)
        {"latitude": 17.42350, "longitude": 78.6560},  # Far outside (~389m)
    ]
    for pt in points:
        client.post(f"/api/pets/{pet_id}/location", json=pt, headers=auth_headers)

    risk_res = client.get(f"/api/pets/{pet_id}/risk", headers=auth_headers)
    assert risk_res.status_code == 200
    data = risk_res.get_json()["data"]

    assert data["risk_level"] in ("MEDIUM", "HIGH")
    assert data["risk_score"] > 35.0
    assert any("boundary" in f.lower() or "perimeter" in f.lower() for f in data["factors"])
