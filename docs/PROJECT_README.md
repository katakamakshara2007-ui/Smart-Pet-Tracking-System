# Smart Pet Tracking and Escape Prediction System

**Department of Data Science — Anurag University**  
*B.Tech Final Year Capstone Project (Academic Year 2025–2026)*

---

## 1. Executive Summary

Domestic pet escapement and straying represent major concerns for animal welfare, safety, and community pet-parenting. Traditional pet tracking devices are often passive (recording location without contextual perimeter analytics) or reliant on complex proprietary subscription architectures.

The **Smart Pet Tracking and Escape Prediction System** is a full-stack, end-to-end IoT-ready surveillance platform developed to provide:
1. **Real-time Geofence Boundary Enforcement**: Continuous spatial analysis determining whether a pet is safely enclosed within its configured perimeter using the mathematical Haversine spherical distance formula.
2. **State Transition-Driven Escape Alerting**: Intelligent event dispatching that triggers instant notifications when a pet crosses from inside to outside, suppressing redundant alerts while remaining outside until safe return is logged.
3. **Explainable Escape-Risk Prediction**: A deterministic, rule-based heuristic scoring engine (0–100) evaluating perimeter proximity, boundary volatility (repeated crossings), and outward trajectory acceleration.
4. **GPS Hardware and Simulation Adaptability**: A decoupled modular pipeline capable of ingesting simulated coordinates via an interactive web console or accepting standard NMEA / decimal GPS fixes from wearable microcontrollers (e.g., ESP32, Arduino, Neo-6M GPS).

---

## 2. System Architecture

```
[ Frontend: React 18 + Vite ]
       │
       │ HTTP / JSON (Axios + JWT Bearer Auth)
       ▼
[ Backend: Python 3 Flask REST API ]
  ├── /api/auth          --> User Registration, Login & Profile Management
  ├── /api/pets          --> Multi-Tenant Pet Profiles (Strict Ownership Isolation)
  ├── /api/pets/:id/location --> GPS Fix Ingestion & State Machine Evaluation
  ├── /api/pets/:id/safezone --> Dynamic Geofence Configuration
  ├── /api/alerts        --> Escape & Safe-Return Audit Log
  ├── /api/pets/:id/risk --> Explainable Heuristic Risk Prediction Engine
  └── /api/dashboard     --> Aggregated Fleet Metrics & Territory Mapping
       │
       │ PyMySQL Driver / SQLAlchemy ORM
       ▼
[ Relational Database: MySQL 8 ]
  ├── users              --> Credentials, password hashes & contact details
  ├── pets               --> Pet profiles, species, breed, age, gender
  ├── safe_zones         --> Center coordinates (lat/lon) & radius (meters)
  ├── pet_locations      --> Real-time and historical GPS breadcrumb coordinates
  ├── alerts             --> Breach events, distance beyond boundary & read status
  └── risk_assessments   --> Explainable factors, scores, and safety recommendations
```

---

## 3. Mathematical & Algorithmic Foundations

### 3.1 Haversine Great-Circle Distance Formula
To compute the exact spherical surface distance $d$ between pet coordinates $(\phi_1, \lambda_1)$ and safe-zone center $(\phi_2, \lambda_2)$:

$$\Delta\phi = \phi_2 - \phi_1, \quad \Delta\lambda = \lambda_2 - \lambda_1$$

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$

$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$

$$d = R \cdot c \quad \text{where } R = 6,371,000 \text{ meters (mean Earth radius)}$$

### 3.2 Geofence State Machine & Alert Logic
To prevent alert fatigue caused by continuous GPS jitter outside the perimeter:
- **State `INSIDE` $\to$ `OUTSIDE`**: Triggers immediate `ESCAPE` alert with distance beyond boundary.
- **State `OUTSIDE` $\to$ `OUTSIDE`**: Logs movement coordinate to database; suppresses duplicate alert.
- **State `OUTSIDE` $\to$ `INSIDE`**: Dispatches `RETURN` notification and resets the boundary state machine.
- **State `INSIDE` $\to$ `INSIDE`**: Normal safe wandering; increments trajectory vector.

### 3.3 Explainable Escape-Risk Prediction Heuristic
The project deliberately avoids unexplainable black-box models in favor of transparent, interpretable data science heuristics:

$$\text{Risk Score} = S_{\text{proximity}} + S_{\text{crossings}} + S_{\text{trajectory}}$$

1. **Perimeter Proximity ($S_{\text{proximity}} \in [0, 40]$ pts)**: Evaluates $d / R_{\text{safezone}}$. Points hovering near the boundary ($>85\%$) or breached outside receive maximum weighting.
2. **Boundary Volatility ($S_{\text{crossings}} \in [0, 35]$ pts)**: Measures frequency of inside/outside boundary crossings in the recent 10-reading window.
3. **Outward Velocity / Trajectory ($S_{\text{trajectory}} \in [0, 25]$ pts)**: Computes distance vector delta across last 3 chronological fixes ($\Delta d = d_3 - d_1$). Positive outward acceleration adds up to 25 points.

| Risk Score Range | Classification | Actionable Recommendation |
| :--- | :--- | :--- |
| **0.0 – 35.0** | `LOW` | Calm movement inside safe base. Normal monitoring adequate. |
| **35.1 – 70.0** | `MEDIUM` | Wandering near perimeter or drifting outwards. Check boundary latches. |
| **70.1 – 100.0** | `HIGH` | Urgent perimeter breach or rapid outward momentum. Inspect immediately. |
| **< 3 fixes** | `INSUFFICIENT_DATA` | Transparent notice requesting more data points before prediction. |

---

## 4. Academic Project Details

- **Institution**: Anurag University, Hyderabad, Telangana, India
- **Department**: Department of Data Science
- **Degree**: Bachelor of Technology (B.Tech)
- **Course**: Final Year Capstone Major Project
- **Academic Year**: 2025–2026
