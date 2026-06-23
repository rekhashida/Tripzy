# Tripzy - Smart Ride Booking & Parcel Delivery System

**Stack:** React.js, Node.js, Express.js, MySQL, Google Maps API, WebSocket, Razorpay.

**Modules:** Ride Booking, Parcel Delivery, Voice-Based Booking, Ride Pooling, Real-Time Tracking.

---

## Project structure

```
Tripzy/
├── backend/           # Node.js + Express API
│   ├── config/        # DB config
│   ├── controllers/   # auth, rides, parcels, pooling, payments, tracking, admin, ratings
│   ├── middleware/   # auth, errorHandler
│   ├── routes/        # API routes
│   ├── services/     # fare, OTP, maps, matching
│   ├── socket/       # WebSocket (driver location broadcast)
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/          # React app
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/     # Ride, Parcel, Voice, Pooling, Tracking, MyRides, MyParcels, Admin
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── database/
│   └── schema.sql     # MySQL tables
├── SETUP.md           # Step-by-step setup
└── README.md
```

---

## Quick start

1. **MySQL:** Create DB and run `database/schema.sql`.
2. **Backend:** Copy `.env.example` to `.env`, set DB and API keys. Run `npm install` then `npm start` in `backend/`.
3. **Frontend:** Create `.env` with `REACT_APP_API_URL=http://localhost:5000/api` and `REACT_APP_SOCKET_URL=http://localhost:5000`. Run `npm install` then `npm start` in `frontend/`.
4. Open http://localhost:3000. Register (user/driver/admin), then use Ride, Parcel, Voice, Pooling, and Tracking.

See **SETUP.md** for full step-by-step instructions and deployment.
