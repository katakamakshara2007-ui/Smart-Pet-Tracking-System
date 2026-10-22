def test_user_registration_and_login(client):
    """Test user registration flow and subsequent authentication."""
    # Register
    reg_res = client.post(
        "/api/auth/register",
        json={
            "name": "Arjun Kumar",
            "email": "arjun@anurag.edu.in",
            "password": "SecurePassword123",
            "phone": "9848012345",
        },
    )
    assert reg_res.status_code == 201
    reg_data = reg_res.get_json()
    assert reg_data["success"] is True
    assert "token" in reg_data["data"]

    # Duplicate registration should fail
    dup_res = client.post(
        "/api/auth/register",
        json={
            "name": "Arjun Kumar",
            "email": "arjun@anurag.edu.in",
            "password": "AnotherPassword",
        },
    )
    assert dup_res.status_code == 409

    # Login with wrong password
    bad_login = client.post(
        "/api/auth/login",
        json={"email": "arjun@anurag.edu.in", "password": "WrongPassword"},
    )
    assert bad_login.status_code == 401

    # Login with correct password
    login_res = client.post(
        "/api/auth/login",
        json={"email": "arjun@anurag.edu.in", "password": "SecurePassword123"},
    )
    assert login_res.status_code == 200
    assert "token" in login_res.get_json()["data"]


def test_pet_ownership_isolation(client, auth_headers, secondary_auth_headers):
    """
    Strict ownership check:
    Verify that User B cannot view, modify, or delete a pet owned by User A.
    """
    # User A creates a pet
    create_res = client.post(
        "/api/pets",
        json={"name": "Shadow", "species": "Dog", "center_latitude": 17.42, "center_longitude": 78.65},
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    pet_id = create_res.get_json()["data"]["id"]

    # User B tries to view User A's pet -> 403 Forbidden
    view_res = client.get(f"/api/pets/{pet_id}", headers=secondary_auth_headers)
    assert view_res.status_code == 403

    # User B tries to update User A's safe zone -> 403 Forbidden
    update_zone_res = client.put(
        f"/api/pets/{pet_id}/safezone",
        json={"center_latitude": 17.50, "center_longitude": 78.70, "radius_meters": 200},
        headers=secondary_auth_headers,
    )
    assert update_zone_res.status_code == 403

    # User B tries to delete User A's pet -> 403 Forbidden
    del_res = client.delete(f"/api/pets/{pet_id}", headers=secondary_auth_headers)
    assert del_res.status_code == 403

    # Verify User A can still access their pet
    user_a_res = client.get(f"/api/pets/{pet_id}", headers=auth_headers)
    assert user_a_res.status_code == 200
    assert user_a_res.get_json()["data"]["name"] == "Shadow"
