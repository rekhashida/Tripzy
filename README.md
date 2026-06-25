# Tripzy - Smart Ride Booking & Parcel Delivery System

Tripzy is a modern, full-stack ride-hailing and parcel delivery application designed for seamless urban transportation and logistics. The application features distinct Rider and Driver experiences, real-time tracking, a simulated digital wallet, safety sharing, and AI-driven price insights.

**Stack:** React.js, Node.js, Express.js, MySQL, Google Maps API, Socket.io, Razorpay.

---

## 🌟 Key Features

* **Dual Portal Experience**: 
  * **Riders**: Book rides, send parcels, join/create pool rides, checkout using a digital wallet, and track trips.
  * **Drivers**: View rides queue, manage online/offline availability status, and track ratings.
* **Simulated Digital Wallet**: Users can top-up their balance and pay for rides/parcels with one-click wallet checkout.
* **Real-Time Tracking & Socket.io**: Dynamic tracking page with live map updates and a WebSocket-powered driver-location simulator.
* **Safety Shield (SMS Live Share)**: One-click live-location SMS simulation to emergency contacts.
* **AI Price Insights & Eco-Ride Leaf**: Dynamic fare explanations (peak surge, traffic) and $CO_2$ carbon offset metrics.
* **Support Chatbot**: Globally mounted chatbot assisting users with instant queries.
* **Multi-Method Auth**: Supports Email/Password login, Mobile OTP verification (SMS simulator), and Google Auth (simulated).

---

## 📁 Project Structure

```text
Tripzy/
├── backend/            # Node.js + Express API
│   ├── config/         # Database connection pool (MySQL)
│   ├── controllers/    # Route controllers (auth, rides, parcels, payments, tracking)
│   ├── middleware/     # JWT authentication & error handler
│   ├── routes/         # Express API endpoints
│   ├── services/       # Core business logic (fare, OTP, maps, matching)
│   ├── socket/         # Socket.io configuration for real-time tracking
│   ├── server.js       # Entry point
│   ├── package.json
│   └── .env.example
├── frontend/           # React SPA
│   ├── public/         # Public static assets & Netlify _redirects
│   ├── src/
│   │   ├── components/ # Reusable UI elements & Support Chatbot
│   │   ├── context/    # Global state management (AuthContext)
│   │   ├── pages/      # Application views (Home, RideBooking, RealTimeTracking, etc.)
│   │   ├── services/   # Axios client and WebSockets
│   │   ├── App.js      # Main router and shell
│   │   └── index.js
│   ├── vercel.json     # Vercel routing rules
│   ├── package.json
│   └── .env.example
├── database/
│   └── schema.sql      # MySQL schema & tables
├── scripts/            # Database utility scripts
├── SETUP.md            # Step-by-step setup guide
└── README.md           # Project overview
```

---

## 🚀 Quick Local Setup

For detailed instructions, see [SETUP.md](file:///d:/tripzy/SETUP.md).

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
   ```
3. Start the server:
   ```bash
   npm run dev
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
   ```
3. Start the development server:
   ```bash
   npm start
   ```

Open `http://localhost:3000` to run the app.

---

## 🌐 Production Deployment
For deploying the database to **Aiven.io**, the backend to **Render**, and the frontend to **Vercel / Netlify**, please follow our step-by-step guide.
