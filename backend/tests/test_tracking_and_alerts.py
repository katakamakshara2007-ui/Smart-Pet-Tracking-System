from app.models.alert import Alert
from app.models.location import PetLocation


def test_tracking_state_machine_and_alerts(client, auth_headers):
    """
    Test full geofence transition workflow:
    1. Create pet with safe zone at (17.4200, 78.6560), radius 100m.
    2. Post inside location -> inside status, 0 escape alerts.
    3. Post outside location -> state transition ESCAPED, 1 escape alert.
    4. Post another outside location -> state STILL_OUTSIDE, NO duplicate alert!
    5. Post inside location -> state RETURNED.
    6. Post outside location again -> state ESCAPED, 2nd escape alert triggered!
    """
    # 1. Create Pet
    pet_res = client.post(
        "/api/pets",
        json={
            "name": "Buddy",
            "species": "Dog",
            "breed": "Golden Retriever",
            "age": 3,
            "gender": "Male",
            "center_latitude": 17.420000,
            "center_longitude": 78.656000,
            "radius_meters": 100.0,
        },
        headers=auth_headers,
    )
    assert pet_res.status_code == 201
    pet_id = pet_res.get_json()["data"]["id"]

    # 2. Location inside (at center)
    loc1_res = client.post(
        f"/api/pets/{pet_id}/location",
        json={"latitude": 17.420000, "longitude": 78.656000, "is_simulated": True},
        headers=auth_headers,
    )
    assert loc1_res.status_code == 201
    assert loc1_res.get_json()["data"]["is_inside"] is True

    # Check alert count (should be 0)
    alerts_res = client.get(f"/api/alerts/pet/{pet_id}", headers=auth_headers)
    assert len(alerts_res.get_json()["data"]) == 0

    # 3. Location outside (250m north: latitude 17.4223)
    loc2_res = client.post(
        f"/api/pets/{pet_id}/location",
        json={"latitude": 17.422300, "longitude": 78.656000, "is_simulated": True},
        headers=auth_headers,
    )
    assert loc2_res.status_code == 201
    data2 = loc2_res.get_json()["data"]
    assert data2["is_inside"] is False
    assert data2["state_transition"] == "ESCAPED"
    assert data2["alert_created"] is not None

    # Check alert count (should be 1 escape alert)
    alerts_res = client.get(f"/api/alerts/pet/{pet_id}", headers=auth_headers)
    alerts = alerts_res.get_json()["data"]
    assert len(alerts) == 1
    assert alerts[0]["alert_type"] == "ESCAPE"

    # 4. Another outside point (300m north: latitude 17.4227)
    loc3_res = client.post(
        f"/api/pets/{pet_id}/location",
        json={"latitude": 17.422700, "longitude": 78.656000, "is_simulated": True},
        headers=auth_headers,
    )
    assert loc3_res.status_code == 201
    data3 = loc3_res.get_json()["data"]
    assert data3["is_inside"] is False
    assert data3["state_transition"] == "STILL_OUTSIDE"
    assert data3["alert_created"] is None  # Must NOT spam duplicate alert

    # Check alert count remains 1 escape alert
    alerts_res = client.get(f"/api/alerts/pet/{pet_id}", headers=auth_headers)
    escape_alerts = [a for a in alerts_res.get_json()["data"] if a["alert_type"] == "ESCAPE"]
    assert len(escape_alerts) == 1

    # 5. Return inside safe zone (latitude 17.4201)
    loc4_res = client.post(
        f"/api/pets/{pet_id}/location",
        json={"latitude": 17.420100, "longitude": 78.656000, "is_simulated": True},
        headers=auth_headers,
    )
    assert loc4_res.status_code == 201
    assert loc4_res.get_json()["data"]["is_inside"] is True
    assert loc4_res.get_json()["data"]["state_transition"] == "RETURNED"

    # 6. Escape outside safe zone once again (latitude 17.4225)
    loc5_res = client.post(
        f"/api/pets/{pet_id}/location",
        json={"latitude": 17.422500, "longitude": 78.656000, "is_simulated": True},
        headers=auth_headers,
    )
    assert loc5_res.status_code == 201
    assert loc5_res.get_json()["data"]["is_inside"] is False
    assert loc5_res.get_json()["data"]["state_transition"] == "ESCAPED"

    # Now there should be 2 ESCAPE alerts total
    alerts_res = client.get(f"/api/alerts/pet/{pet_id}", headers=auth_headers)
    escape_alerts = [a for a in alerts_res.get_json()["data"] if a["alert_type"] == "ESCAPE"]
    assert len(escape_alerts) == 2


def test_mark_alert_as_read(client, auth_headers):
    """Test marking an alert as read individually and in bulk."""
    # Create pet and escape alert
    pet_res = client.post(
        "/api/pets",
        json={"name": "Milo", "species": "Cat", "center_latitude": 17.42, "center_longitude": 78.65, "radius_meters": 50},
        headers=auth_headers,
    )
    pet_id = pet_res.get_json()["data"]["id"]

    # Trigger outside alert
    client.post(
        f"/api/pets/{pet_id}/location",
        json={"latitude": 17.43, "longitude": 78.65, "is_simulated": True},
        headers=auth_headers,
    )

    alerts_res = client.get("/api/alerts?unread_only=true", headers=auth_headers)
    unread = alerts_res.get_json()["data"]
    assert len(unread) >= 1
    alert_id = unread[0]["id"]

    # Mark single alert as read
    read_res = client.patch(f"/api/alerts/{alert_id}/read", headers=auth_headers)
    assert read_res.status_code == 200
    assert read_res.get_json()["data"]["is_read"] is True

    # Bulk mark as read
    bulk_res = client.post("/api/alerts/mark-all-read", headers=auth_headers)
    assert bulk_res.status_code == 200
