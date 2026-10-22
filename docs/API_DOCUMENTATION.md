# Smart Pet Tracking REST API Documentation

**Base URL**: `http://localhost:5000/api`  
**Authentication**: Bearer JWT Token (`Authorization: Bearer <TOKEN>`)

---

## 1. Authentication Endpoints

### 1.1 Register New User
- **Method**: `POST`
- **Endpoint**: `/auth/register`
- **Request Body**:
```json
{
  "name": "Anurag Student",
  "email": "student@anurag.edu.in",
  "password": "Password123!",
  "phone": "+91 98765 43210"
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "message": "Registration successful. Welcome to Smart Pet Tracking!",
  "data": {
    "user": {
      "id": 1,
      "name": "Anurag Student",
      "email": "student@anurag.edu.in",
      "phone": "+91 98765 43210"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 1.2 User Login
- **Method**: `POST`
- **Endpoint**: `/auth/login`
- **Request Body**:
```json
{
  "email": "student@anurag.edu.in",
  "password": "Password123!"
}
```
- **Response** (`200 OK`):
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Anurag Student",
      "email": "student@anurag.edu.in"
    }
  }
}
```

---

## 2. Pet Management Endpoints

### 2.1 List All User Pets
- **Method**: `GET`
- **Endpoint**: `/pets`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (`200 OK`):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Buddy",
      "species": "Dog",
      "breed": "Golden Retriever",
      "age": 3,
      "gender": "Male",
      "status": "INSIDE",
      "safe_zone": {
        "center_latitude": 17.420000,
        "center_longitude": 78.656000,
        "radius_meters": 100.0
      },
      "latest_location": {
        "latitude": 17.420100,
        "longitude": 78.656050,
        "distance_from_center": 12.3,
        "is_inside": true
      }
    }
  ]
}
```

### 2.2 Register Pet
- **Method**: `POST`
- **Endpoint**: `/pets`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "name": "Buddy",
  "species": "Dog",
  "breed": "Golden Retriever",
  "age": 3,
  "gender": "Male",
  "center_latitude": 17.420000,
  "center_longitude": 78.656000,
  "radius_meters": 100.0
}
```

---

## 3. Tracking & Geofence Simulation Endpoints

### 3.1 Transmit GPS Fix (Hardware or Simulated)
- **Method**: `POST`
- **Endpoint**: `/pets/<pet_id>/location`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "latitude": 17.421500,
  "longitude": 78.656000,
  "is_simulated": true
}
```
- **Response** (`201 Created`):
```json
{
  "success": true,
  "message": "Location recorded successfully.",
  "data": {
    "is_inside": false,
    "distance_from_center": 166.8,
    "margin": -66.8,
    "state_transition": "ESCAPED",
    "alert_created": {
      "id": 5,
      "alert_type": "ESCAPE",
      "message": "Escape Alert: Buddy has crossed the safe zone boundary! Distance: 166.8m (66.8m outside perimeter).",
      "is_read": false
    },
    "location": {
      "id": 14,
      "latitude": 17.421500,
      "longitude": 78.656000,
      "distance_from_center": 166.8,
      "is_inside": false,
      "timestamp": "2026-10-22T15:20:00"
    }
  }
}
```

### 3.2 Get Latest Location
- **Method**: `GET`
- **Endpoint**: `/pets/<pet_id>/location/latest`

### 3.3 Get Movement History
- **Method**: `GET`
- **Endpoint**: `/pets/<pet_id>/location/history?limit=100`

---

## 4. Safe-Zone Settings

### 4.1 Get Configured Safe Zone
- **Method**: `GET`
- **Endpoint**: `/pets/<pet_id>/safezone`

### 4.2 Update Safe Zone
- **Method**: `POST` or `PUT`
- **Endpoint**: `/pets/<pet_id>/safezone`
- **Request Body**:
```json
{
  "center_latitude": 17.420000,
  "center_longitude": 78.656000,
  "radius_meters": 120.0
}
```

---

## 5. Alerts Endpoints

### 5.1 List Alerts
- **Method**: `GET`
- **Endpoint**: `/alerts?unread_only=false&pet_id=1`

### 5.2 Mark Alert as Read
- **Method**: `PATCH`
- **Endpoint**: `/alerts/<alert_id>/read`

### 5.3 Mark All Alerts as Read
- **Method**: `POST`
- **Endpoint**: `/alerts/mark-all-read`

---

## 6. Escape-Risk Assessment

### 6.1 Compute Explainable Risk Score
- **Method**: `GET`
- **Endpoint**: `/pets/<pet_id>/risk`
- **Response** (`200 OK`):
```json
{
  "success": true,
  "data": {
    "pet_id": 2,
    "pet_name": "Luna",
    "risk_score": 80.0,
    "risk_level": "HIGH",
    "status_title": "High Escape Risk",
    "proximity_score": 40.0,
    "crossing_score": 25.0,
    "trajectory_score": 15.0,
    "factors": [
      "Perimeter Status: Pet is currently OUTSIDE the safe zone by 53.3m (Distance: 133.3m / Permitted: 80.0m). (+40 pts)",
      "Boundary Stability: Moderate boundary agitation (2 boundary crossings recorded). (+25 pts)",
      "Trajectory Vector: Consistent outward trend (+61.1m towards safe-zone boundary). (+15 pts)"
    ],
    "recommendations": "Urgent: Pet is beyond or rapidly approaching the boundary perimeter. Inspect physical enclosures immediately.",
    "data_points_count": 5
  }
}
```

---

## 7. Dashboard Fleet Summary

### 7.1 Aggregate Fleet Metrics
- **Method**: `GET`
- **Endpoint**: `/dashboard/stats`
