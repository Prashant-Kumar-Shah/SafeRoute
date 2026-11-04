# 🛡️ SafeRoute — The Shortest Path isn't Always the Safest
## SafeRoute — Navigate Smart. Travel Safe.

**SafeRoute** is a security-first, community-driven navigation application designed to rank and recommend travel paths based on safety rather than just speed. 

Standard GPS apps optimize for the fastest route, which frequently leads pedestrians, solo night commuters, tourists, and students through dark, isolated, or high-risk shortcuts. SafeRoute solves this by calculating safety scores using real-time lighting levels, crowdsourced incident reports, time-of-day risks, and proximity to safe havens.



---

## 🌐 Live Demo & Project Documentation

🚀 **Live Website:** [Open SafeRoute](https://saferoute-client.onrender.com)

📄 **Project Report:** [View SafeRoute Report (PDF)](./SafeRoute%20Report.pdf)

📊 **Project Presentation:** [View SafeRoute Presentation (PDF)](./SafeRoute%20Presentation.pdf)

---


## 🛠️ Tech Stack

### Frontend (Client)
<p align="left">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion" />
  <img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" />
</p>

*   **React & Vite:** Fast, modern frontend framework and bundler for a highly responsive UI.
*   **Framer Motion:** Handles premium animations, page transitions, and interactive slider experiences.
*   **Leaflet & React-Leaflet:** Coordinates dark-themed interactive map layers, custom markers, and route paths.
*   **Socket.io-client:** Allows real-time bidirectional event streaming for GPS coordinates.

### Backend (Server)
<p align="left">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="NodeJS" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/JSON_Web_Tokens-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
</p>

*   **Node.js & Express.js:** Fast, asynchronous server runtime and REST API structure.
*   **MongoDB & Mongoose:** Scalable database for secure schemas of users, incidents, and emergency contacts.
*   **Socket.io:** Handles stateful socket connections to stream real-time client location coordinates.
*   **JWT & Bcrypt:** Secure token-based user sessions and encrypted password storage.

### Services & APIs
<p align="left">
  <img src="https://img.shields.io/badge/OpenStreetMap-7EBC6F?style=for-the-badge&logo=openstreetmap&logoColor=white" alt="OSM" />
  <img src="https://img.shields.io/badge/Overpass_API-FF6F00?style=for-the-badge&logo=google-cloud&logoColor=white" alt="Overpass" />
</p>

*   **OSRM (Open Source Routing Machine):** Generates geometrical route coordinates.
*   **Nominatim Geocoding:** Powers address lookups and autocomplete queries.
*   **Overpass API:** Integrates fallbacks for municipal safe haven location queries.

---

## 🚀 Key Features

*   **📊 Safety Score Engine:** Calculates a safety rating (1–10) for every route using weighted metrics including street lighting data, community-reported incidents, and time-of-day risk.
*   **🔀 Fastest vs. Safest Comparison:** Compare routes side-by-side. Make an informed trade-off between a few minutes of extra travel time and total peace of mind.
*   **👥 Crowdsourced Safety Reports:** Report incidents dynamically (e.g., poor lighting, snatching, harassment, isolated road, suspicious activity) with a built-in 10-minute rate limiter to prevent spam.
*   **📍 Live Tracking (Guardian Mode):** Streams your real-time coordinates securely to the server via WebSockets, allowing selected contacts to monitor your progress.
*   **🚨 One-Click SOS Emergency Button:** Instantly broadcasts your last known GPS coordinates and a distress message to all saved emergency contacts.
*   **🏥 Safe Havens Map Integration:** Displays nearby police stations, hospitals, and pharmacies on-demand with instant routing directly to them in case of danger.
*   **📱 Progressive Web App (PWA):** Installable directly onto Android (Chrome) and iOS (Safari Share > Add to Home Screen) for native execution, offline caching, and lightweight performance.
*   **✨ Interactive Step-by-Step Demo:** A fullscreen, premium onboarding guide that showcases safety scores, Leaflet routing animations, and incident reports.

---

## ⚙️ Environment Variables Setup

Before running the project, configure your environment variables.

### Backend (`server/.env`)
Create a `.env` file inside the `server/` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/saferoute?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
OSRM_BASE_URL=http://router.project-osrm.org
```

### Frontend (`client/.env`)
Create a `.env` file inside the `client/` directory:
```env
VITE_API_URL=http://localhost:5000
```

---

## 💻 Local Development Setup

To run SafeRoute locally:

### 1. Run the Backend Server
```bash
cd server
npm install
npm run dev
```
*The server will start on `http://localhost:5000`.*

### 2. Run the Frontend Client
```bash
cd client
npm install
npm run dev
```
*The client will start on `http://localhost:5173`.*

---

## 📱 Testing PWA & GPS on Mobile

Modern mobile browsers strictly block Progressive Web Apps (PWA) installation and Service Worker registrations over non-secure connections (`http://`). 

To test SafeRoute on a physical phone:
1.  Initialize a secure HTTPS tunnel pointing to your local client port:
    ```bash
    npx ngrok http 5173
    ```
2.  Open the generated `https://xxxx.ngrok-free.app` URL on your phone's browser.
3.  Install the PWA:
    *   **Android (Chrome):** Click the "Install" prompt in the address bar or menu.
    *   **iOS (Safari):** Tap **Share** > **Add to Home Screen**.

---

## 🔒 Security & Privacy

*   **Zero Historical Tracking:** SafeRoute does not store your historical routes on its servers. Coordinates are streamed in real-time only while navigation is active and discarded immediately after.
*   **Anonymized Reports:** Safety incident reports are completely decoupled from your personal information to protect the reporter's identity.
