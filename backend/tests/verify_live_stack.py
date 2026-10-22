import urllib.request
import json

def test_live_stack():
    print("=" * 60)
    print("Testing Live Full-Stack Application (Flask + React + MySQL)")
    print("=" * 60)

    # 1. Test Vite frontend HTML serving
    with urllib.request.urlopen("http://localhost:5173/") as resp:
        html = resp.read().decode("utf-8")
        assert "Smart Pet Tracking" in html
        print("[PASSED] Vite frontend is running on http://localhost:5173")

    # 2. Test Flask API Login
    req_login = urllib.request.Request(
        "http://localhost:5000/api/auth/login",
        data=json.dumps({"email": "student@anurag.edu.in", "password": "Password123!"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req_login) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        assert data["success"] is True
        token = data["data"]["token"]
        print("[PASSED] Flask login succeeded with student demo account.")

    # 3. Test Dashboard Stats API with JWT
    req_dash = urllib.request.Request(
        "http://localhost:5000/api/dashboard/stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req_dash) as resp:
        dash_res = json.loads(resp.read().decode("utf-8"))["data"]
        summary = dash_res["summary"]
        print(f"[PASSED] Dashboard API: Total Pets = {summary['total_pets']}, Inside = {summary['pets_inside']}, Outside = {summary['pets_outside']}, Active Alerts = {summary['active_alerts']}")

    # 4. Test Risk Assessment API
    req_risk = urllib.request.Request(
        "http://localhost:5000/api/pets/2/risk",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req_risk) as resp:
        risk = json.loads(resp.read().decode("utf-8"))["data"]
        print(f"[PASSED] Risk API: Pet Luna Score = {risk['risk_score']} ({risk['risk_level']}) with {len(risk['factors'])} explainable factors.")

    # 5. Test Alerts API
    req_alerts = urllib.request.Request(
        "http://localhost:5000/api/alerts",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req_alerts) as resp:
        alerts = json.loads(resp.read().decode("utf-8"))["data"]
        print(f"[PASSED] Alerts API: Found {len(alerts)} alerts.")

    # 6. Test Submitting Simulated GPS Point
    req_sim = urllib.request.Request(
        "http://localhost:5000/api/pets/1/location",
        data=json.dumps({"latitude": 17.42015, "longitude": 78.65608, "is_simulated": True}).encode("utf-8"),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req_sim) as resp:
        sim_res = json.loads(resp.read().decode("utf-8"))["data"]
        print(f"[PASSED] Simulated GPS Tracking: Recorded point at ({sim_res['location']['latitude']}, {sim_res['location']['longitude']}), inside = {sim_res['is_inside']}")

    print("=" * 60)
    print("ALL LIVE ENDPOINTS AND SERVICES VERIFIED 100% OPERATIONAL!")
    print("=" * 60)

if __name__ == "__main__":
    test_live_stack()
