# Tripzy - Premium Smart Ride Booking & Parcel Delivery System 🚕📦

Tripzy is a state-of-the-art, full-stack urban mobility and logistics platform designed to provide premium, Ola/Uber/Rapido-competitive ride-hailing, parcel delivery, and ride-pooling services. Built with a gorgeous, high-contrast dark mode interface, the project integrates real-time WebSocket synchronization, custom accessibility features, multi-lingual capabilities, and advanced AI-assisted customer support.

**Live Frontend Demo:** [tripzy-delta.vercel.app](https://tripzy-delta.vercel.app/)

---

## 🌟 Premium Features

### 1. 🌐 Global Multi-Language System (EN, HI, GU)
* **Instant Translations**: Seamlessly switch the entire application, navigation menus, booking panels, and chatbot instructions between **English**, **Hindi (हिन्दी)**, and **Gujarati (ગુજરાતી)**.
* **Multi-lingual Voice Booking**: Speak your route naturally in your selected language (e.g. *“Ahmedabad to Vadodara”*, *“गोत्री से वृन्दावन सर्कल”*, or *“ગોત્રી થી વૃંદાવન સર્કલ”*). The built-in voice recognizer automatically parses and geocodes your pick-up and destination points using localized grammar regex filters.

### 2. 🤖 Interactive Gemini-Powered TripzyBot
* **State-of-the-Art AI**: Integrated with the **Google Gemini 3.5 Flash API** to answer any open-ended question (travel tips, local packing guides, general knowledge) in addition to Tripzy policies.
* **Visual Floating Widget**: A global, floating circular widget featuring a custom SVG brand robot-car avatar, bouncing invite tooltips, and interactive quick-replies.
* **Auto-Language Matching**: Automatically replies in the user's active language choice. Includes a self-healing offline rule-based parser fallback.

### 3. ⚡ WebSocket-Powered Real-Time Driver Flow
* **Interactive Driver Flow**: Drivers can go online/offline, view nearby matches, accept rides, and input verification OTPs to start and complete rides.
* **Live Rider Sync**: Real-time status update broadcasts synchronizing driver actions directly with the passenger's tracking screen via WebSockets, triggering automatic state transitions without page reloads.

### 4. ⭐ Post-Ride Driver Rating & Feedback
* **Dynamic Feedback Modal**: Automatically prompts passengers upon ride completion.
* **Star Selector & Tags**: Features an interactive 1-to-5 star hover selector, custom positive chip tags (*"Clean Car 🧼"*, *"Safe Driving 🛡️"*, *"Polite Driver 😊"*), and comments updating driver database profiles instantly.

### 5. 🗺️ Advanced Map Views & Traffic Overlays
* **5 Map View Modes**: Toggle between **Street View** (OSM default), **Hybrid View** (satellite + labels), **Terrain View** (contours), **Globe View** (high-altitude overview), and **3D Nav 🚀** cockpit view perspective tilt.
* **Simulated Traffic Polyline**: Draws color-coded route segments representing live traffic flows—**Green** (smooth), **Orange** (moderate), and **Red** (heavy slowdowns) completely for free without commercial keys.
* **Vadodara Biased Autocomplete**: Suggests circles, char rastas, and societies in Gujarat first, featuring self-healing search fallback logic.

### 6. 🛡️ Safety Shield Panel
* **Live GPS Geolocation**: Grabs the passenger's actual browser coordinates via the HTML5 Geolocation API.
* **Emergency Broadcast SMS**: Instantly formats and simulates an SMS share containing: *Driver Name, Driver Phone, Vehicle Type, License Plate, Driver License Number, and User's Live Coordinates*.

### 7. 📢 Admin Campaign & Google OAuth
* **User Reactivation Campaign**: Admin panel triggers backend database queries targeting users inactive for over a week, dispatching transactional SMS nudges.
* **Google Account List Picker**: Configured Google Identity SDK with explicit account choosers for multi-account login on shared devices.

---

## 📁 Project Structure

```text
Tripzy/
├── backend/            # Node.js + Express API
│   ├── config/         # Database connection pool (MySQL)
│   ├── controllers/    # Route controllers (auth, rides, parcels, chatbot, admin, tracking)
│   ├── middleware/     # JWT authentication & error handler
│   ├── routes/         # Express API endpoints
│   ├── services/       # Core business logic (fare, OTP, maps, matching, sms)
│   ├── socket/         # Socket.io configuration for real-time tracking
│   ├── server.js       # Entry point
│   ├── package.json
│   └── .env.example
├── frontend/           # React SPA
│   ├── public/         # Public static assets
│   ├── src/
│   │   ├── components/ # Reusable UI components & Floating Support Chatbot
│   │   ├── context/    # Global state management (AuthContext, LanguageContext)
│   │   ├── pages/      # Application views (Home, RideBooking, RealTimeTracking, etc.)
│   │   ├── services/   # Axios client and WebSockets
│   │   ├── App.js      # Main router and shell
│   │   └── index.js
│   ├── package.json
│   └── .env.example
├── database/
│   └── schema.sql      # MySQL schema & tables
├── SETUP.md            # Step-by-step setup guide
└── README.md           # Project overview
```

---

## 🚀 Quick Local Setup

### 1. Database (MySQL)
Create database `tripzy_db` and initialize tables:
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend (Node.js)
1. Navigate to `/backend` and install dependencies:
   ```bash
   cd backend && npm install
   ```
2. Copy `.env.example` to `.env` and fill in your details:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=tripzy_db
   JWT_SECRET=your_jwt_secret
   GOOGLE_MAPS_API_KEY=your_maps_key
   GEMINI_API_KEY=your_google_ai_studio_gemini_key
   ```
3. Start the server:
   ```bash
   npm start
   ```

### 3. Frontend (React)
1. Navigate to `/frontend` and install dependencies:
   ```bash
   cd ../frontend && npm install
   ```
2. Copy `.env.example` to `.env`:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   REACT_APP_GOOGLE_MAPS_API_KEY=your_maps_key
   REACT_APP_GOOGLE_CLIENT_ID=your_google_oauth_client_id
   ```
3. Start the development server:
   ```bash
   npm start
   ```

Open `http://localhost:3000` to run the app.

---

## 🌐 Production Deployment
* **Database**: Hosted on **Aiven.io** (MySQL).
* **Backend**: Hosted on **Render** or **Railway** (persistent node environments for WebSockets).
* **Frontend**: Hosted on **Vercel** with custom redirects.
* **Environment variables**: Add your `GEMINI_API_KEY`, `GOOGLE_MAPS_API_KEY`, and SMS API credentials in your hosting provider's dashboard configuration.
