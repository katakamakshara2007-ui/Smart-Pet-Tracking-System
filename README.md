# Smart Pet Tracking and Escape Prediction System

**Department of Data Science — Anurag University**  
*B.Tech Major Capstone Project*

---

## 🐾 Overview

The **Smart Pet Tracking and Escape Prediction System** is a responsive web application that tracks pet locations in real time, enforces virtual geofence boundaries using the spherical Haversine formula, generates automated escape alerts, and predicts escape risks using an explainable heuristic scoring engine.

### Key Capabilities:
- 🗺️ **Interactive Leaflet / OpenStreetMap Surveillance**: Real-time map displaying safe-zone perimeters, pet locations, and breadcrumb trails.
- 📡 **GPS Hardware & Simulation Support**: Interactive D-pad controls, preset jump buttons, and automated walk simulator for classroom demonstrations.
- 🚨 **Intelligent Alert State Machine**: Dispatches notifications upon crossing perimeter edges while suppressing redundant spam alerts while remaining outside.
- 📊 **Explainable Escape-Risk Prediction**: Transparent heuristic analyzing proximity ratios, boundary agitation frequency, and outward trajectory acceleration (Low / Medium / High / Insufficient Data).
- 🔒 **Security & Multi-Tenancy**: JWT Bearer token authentication, hashed passwords with bcrypt/werkzeug, and strict tenant ownership checks.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.10+ &bull; Flask 3 &bull; Flask-SQLAlchemy &bull; Flask-JWT-Extended &bull; PyMySQL &bull; Werkzeug &bull; pytest
- **Frontend**: React 18 &bull; Vite 5 &bull; React Router 6 &bull; Axios &bull; Leaflet &bull; OpenStreetMap &bull; Vanilla CSS
- **Database**: MySQL 8 (`smart_pet_tracking`)
- **Platform**: Windows / Linux / macOS compatible

---

## 📁 Project Structure

```
Smart-Pet-Tracking-System/
├── backend/
│   ├── app/
│   │   ├── models/            # SQLAlchemy Database Models (User, Pet, SafeZone, Location, Alert, Risk)
│   │   ├── routes/            # Blueprint Route Handlers (auth, pets, tracking, safezone, alerts, risk, dashboard)
│   │   ├── services/          # Business Services (geofence, tracking state machine, risk prediction)
│   │   ├── utils/             # Helpers (auth ownership verification, response formatter, validators)
│   │   └── __init__.py        # Flask App Factory & Extension Initialization
│   ├── tests/                 # Comprehensive Pytest Suite & Live Stack Verification
│   ├── config.py              # Configuration & MySQL / SQLite Fallbacks
│   ├── run.py                 # Backend Entrypoint (Port 5000)
│   ├── requirements.txt       # Tested, Stable Python Dependencies
│   └── .env.example           # Backend Environment Configuration Template
├── frontend/
│   ├── src/
│   │   ├── api/               # Centralized Axios Client & REST Endpoints
│   │   ├── components/        # LeafletMap, Navbar, Footer, ProtectedRoute
│   │   ├── context/           # AuthContext (JWT State & Session Persistence)
│   │   ├── pages/             # All 11 Functional Pages
│   │   └── index.css          # Design System (White background, Navy headings, Light-blue accents)
│   ├── package.json           # React & Vite Dependencies
│   └── vite.config.js         # Vite Configuration & Proxy (Port 5173)
├── database/
│   ├── schema.sql             # Complete MySQL 8 Database Schema & Indexes
│   ├── init_db.py             # Automated DB Table Initializer
│   └── seed_demo_data.py      # Seed Script with Demo Account & Pets
├── docs/
│   ├── PROJECT_README.md      # Detailed Technical Specification & Architecture
│   ├── API_DOCUMENTATION.md   # Complete REST API Reference with JSON Payloads
│   └── TESTING_GUIDE.md       # Full Automated & Manual Testing Documentation
├── start-project.bat          # 1-Click Windows Startup Script
├── stop-project.bat           # 1-Click Windows Shutdown Script
├── .env.example               # Root Environment Template
└── README.md                  # Main Documentation
```

---

## 🚀 Quick Start Guide (Windows)

### Prerequisites:
1. **Python 3.10 or 3.11** installed (`python --version`)
2. **Node.js (v18+) & npm** installed (`node --version`)
3. **MySQL Server 8.0** running locally on port 3306

---

### Step 1: Database Setup (MySQL)
Open MySQL command line or MySQL Workbench:

```sql
CREATE DATABASE IF NOT EXISTS smart_pet_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or execute the provided initialization script using the backend virtual environment:

```cmd
cd Smart-Pet-Tracking-System
backend\venv\Scripts\python database\init_db.py
backend\venv\Scripts\python database\seed_demo_data.py
```

*Default Demo Credentials Created:*
- **Email**: `student@anurag.edu.in`
- **Password**: `Password123!`

---

### Step 2: Configure Environment Variables
Copy `.env.example` in `backend/`:

```cmd
copy backend\.env.example backend\.env
```

Edit `backend\.env` with your MySQL root password:
```ini
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_pet_tracking
```

---

### Step 3: Install Backend Dependencies & Start Flask

```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python run.py
```
*The Flask backend server will start at `http://localhost:5000`.*

---

### Step 4: Install Frontend Dependencies & Start React

Open a second terminal window:

```cmd
cd frontend
npm install
npm run dev
```
*The React application will be available at `http://localhost:5173`.*

---

## ⚡ 1-Click Windows Startup & Shutdown Scripts

For easy presentation and testing, run:
- **`start-project.bat`**: Automatically starts the Flask backend on port 5000 and the Vite frontend on port 5173 in separate command windows.
- **`stop-project.bat`**: Gracefully terminates both frontend and backend processes.

---

## 🧪 Testing

Execute the automated test suite:

```cmd
cd backend
venv\Scripts\pytest -v
```

Execute the live stack end-to-end integration test:

```cmd
backend\venv\Scripts\python backend\tests\verify_live_stack.py
```

Validate the frontend build:

```cmd
cd frontend
npm run build
```

---

## 🔧 Resolving Port Conflicts

- **Port 5000 (Flask)**: If another application uses port 5000, specify `PORT=5001` in `backend/.env` and adjust the proxy target in `frontend/vite.config.js`.
- **Port 5173 (Vite)**: If port 5173 is occupied, Vite will automatically prompt or select 5174. You can also specify `--port <PORT>` in `frontend/package.json`.

---

## 🎓 Academic Presentation Notes

When presenting this project at Anurag University:
1. **Live GPS Demonstration**: Use the *Pet Tracking Map* page. Click the "Breach Boundary (~130m)" button to trigger an escape alert live during demonstration.
2. **Explainable AI Justification**: On the *Escape-Risk Prediction* page, explain how the model uses clear spatial heuristics (perimeter proximity, boundary crossing volatility, trajectory acceleration) rather than an opaque black box.
3. **Data Security**: Demonstrate that User B cannot access or modify User A's pets, upholding multi-tenant cloud security standards.
