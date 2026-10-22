# Deployment & Team Sharing Guide

**Smart Pet Tracking and Escape Prediction System**  
*Department of Data Science — Anurag University*

---

This guide outlines the three best methods to share and deploy the project with your teammates, guide, or examination committee:

1. **Option A: Instant Local Sharing (ZIP / GitHub)** — Quickest, zero cost, no internet setup required.
2. **Option B: Instant Public Live Link via Cloudflare / Ngrok** — Shares your running laptop screen with teammates anywhere in 2 minutes.
3. **Option C: Free 24/7 Cloud Deployment (Vercel + Render + Cloud MySQL)** — Professional public website URL (`https://your-pet-tracker.vercel.app`) to include in your project report and presentation slides.

---

## Option A: Direct File Sharing & GitHub (Recommended for Coding)

### 1. Sharing the ZIP File
1. Copy **`Smart-Pet-Tracking-System.zip`** from your Desktop.
2. Send it to your teammates via:
   - Google Drive link
   - WhatsApp Web / Telegram
   - Pen drive / USB drive
3. Your teammates simply:
   - Extract the ZIP on Windows.
   - Double-click **`start-project.bat`** to run the app.

### 2. Sharing via GitHub (Best for Team Version Control)
1. Initialize Git in the project root:
   ```cmd
   cd Smart-Pet-Tracking-System
   git init
   git add .
   git commit -m "Initial commit of Smart Pet Tracking System"
   ```
2. Create a new repository on [GitHub](https://github.com/new) named `Smart-Pet-Tracking-System`.
3. Push your code:
   ```cmd
   git remote add origin https://github.com/<your-username>/Smart-Pet-Tracking-System.git
   git branch -M main
   git push -u origin main
   ```
4. Add your teammates as collaborators under **Settings > Collaborators** on GitHub.

---

## Option B: Instant Public Live Link via Cloudflare Tunnel (Zero Setup)

If your app is running locally on your laptop and you want teammates or your professor to view and interact with it right now from their phones or laptops:

1. Download the free lightweight standalone Cloudflare tunnel binary [cloudflared-windows-amd64.exe](https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe).
2. Open a command prompt and run:
   ```cmd
   cloudflared tunnel --url http://localhost:5173
   ```
3. Cloudflare will output a public HTTPS link (e.g. `https://random-words.trycloudflare.com`).
4. Send that link to your teammates. Anyone can open it on their mobile phone or PC and see your live dashboard, map, and GPS simulator!

*(Alternatively, use `npx localtunnel --port 5173` or `ngrok http 5173`).*

---

## Option C: Permanent Free Cloud Deployment (Vercel + Render)

Deploying a live public URL gives maximum credibility for your B.Tech major project examination.

### Architecture for Cloud:
- **Frontend**: Hosted on [Vercel](https://vercel.com) (Free)
- **Backend**: Hosted on [Render](https://render.com) (Free Web Service)
- **Database**: Free Cloud MySQL on [Aiven.io](https://aiven.io) or [TiDB Cloud](https://tidbcloud.com)

---

### Step 1: Free Cloud MySQL Database (Aiven or TiDB)
1. Sign up for a free account at [Aiven.io](https://aiven.io) or [TiDB Cloud](https://tidbcloud.com).
2. Create a free MySQL database named `smart_pet_tracking`.
3. Copy the database connection URI:
   `mysql+pymysql://<user>:<password>@<host>:<port>/smart_pet_tracking`
4. Run `database/schema.sql` inside the cloud database console.

---

### Step 2: Deploy Backend to Render.com (Free)
1. Push your project to GitHub.
2. Sign in to [Render.com](https://render.com) with GitHub.
3. Click **New + > Web Service**.
4. Select your GitHub repository.
5. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn run:app`
6. Add Environment Variables under **Environment**:
   - `FLASK_ENV`: `production`
   - `SECRET_KEY`: `your-random-secret-key`
   - `JWT_SECRET_KEY`: `your-random-jwt-key`
   - `DATABASE_URL`: Your cloud MySQL URI from Step 1
7. Click **Create Web Service**. Render will deploy your API to `https://smart-pet-api.onrender.com`.

---

### Step 3: Deploy Frontend to Vercel (Free)
1. Sign in to [Vercel](https://vercel.com) with GitHub.
2. Click **Add New > Project** and import your repository.
3. Configure settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://smart-pet-api.onrender.com/api`
5. Click **Deploy**.
6. In ~60 seconds, your site will be live at:
   `https://smart-pet-tracking.vercel.app`!
