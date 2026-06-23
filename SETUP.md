# Tripzy - Step-by-Step Setup Guide

## What you need installed

- **Node.js** (v18+): https://nodejs.org/
- **MySQL** (8.0+): https://dev.mysql.com/downloads/
- **Git** (optional): https://git-scm.com/

---

## Step 1: Database (MySQL)

1. Install MySQL and start the MySQL service.
2. Open MySQL shell or any client (e.g. MySQL Workbench, phpMyAdmin).
3. Run the schema file:

   ```bash
   mysql -u root -p < database/schema.sql
   ```

   Or copy-paste the contents of `Tripzy/database/schema.sql` into your MySQL client and execute. This creates database `tripzy_db` and all tables (users, drivers, rides, parcels, ride_pools, payments, ratings, otp_store, driver_locations).

4. Note your MySQL **username** and **password** for the next step.

---

## Step 2: Backend (Node.js + Express)

1. Open a terminal and go to the backend folder:

   ```bash
   cd Tripzy/backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment file:

   - Copy `backend/.env.example` to `backend/.env`.
   - Edit `backend/.env` and set:

   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=tripzy_db
   JWT_SECRET=your_random_secret_string
   GOOGLE_MAPS_API_KEY=your_google_maps_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

   - **Google Maps API key:** https://console.cloud.google.com/ → APIs & Services → enable “Maps JavaScript API” and “Distance Matrix API” → create key.
   - **Razorpay:** https://dashboard.razorpay.com/ → get Key ID and Key Secret (use Test mode for development).

4. Start the backend:

   ```bash
   npm start
   ```

   Or for auto-restart during development:

   ```bash
   npm run dev
   ```

   Backend runs at **http://localhost:5000**. WebSocket runs on the same server.

---

## Step 3: Frontend (React)

1. Open another terminal and go to the frontend folder:

   ```bash
   cd Tripzy/frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` in `frontend/`:

   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

4. **Google Maps API Key:** Get your key from https://console.cloud.google.com/ → APIs & Services → enable "Maps JavaScript API" and "Places API" → create key. Add it to `frontend/.env` as `REACT_APP_GOOGLE_MAPS_API_KEY`. The app uses `@react-google-maps/api` which loads maps automatically. If you skip this, map UI will show a placeholder but the app will work (you can use coordinates only).

5. Start the frontend:

   ```bash
   npm start
   ```

   Frontend runs at **http://localhost:3000**.

---

## Step 4: First use

1. Open http://localhost:3000.
2. Click **Register**. Create:
   - A **user** (for booking rides, parcels, pooling, voice).
   - Optionally a **driver** (role = driver; you may need to add driver record in DB or extend register to accept vehicle_type etc.).
   - Optionally an **admin** (role = admin) for the admin dashboard.
3. Login and use:
   - **Ride Booking:** Enter pickup/drop coordinates (e.g. 23.0225, 72.5714 and 23.0300, 72.5800), vehicle type, luggage → Estimate Fare → Book Ride. You get OTP to share with driver.
   - **Parcel Delivery:** Enter pickup/drop, recipient, weight → Create Parcel. OTPs for pickup and drop.
   - **Voice Booking:** Use voice (Chrome) or type, then enter coordinates and Book.
   - **Ride Pooling:** Create a pool ride or join an available pool.
   - **Real-Time Tracking:** After booking, you are redirected to `/tracking/:rideId`. Driver location updates via WebSocket when driver sends location.

---

## Step 5: APIs used in the project

| Purpose            | Where to get / use |
|--------------------|--------------------|
| **Google Maps**    | Console: Maps JavaScript API, Distance Matrix API. Key in backend `.env` and in `frontend/public/index.html`. |
| **Razorpay**       | Dashboard: Key ID & Secret in backend `.env`. Frontend: use Razorpay.js script and key from your backend create-order response. |
| **WebSocket**      | Built-in: Socket.IO on same server (port 5000). Frontend uses `REACT_APP_SOCKET_URL`. |
| **SMS (OTP)**      | Optional: integrate Twilio/MSG91 in backend and call from `otpService` when sending OTP. |

---

## Step 6: Deploy (high level)

- **Backend:** Deploy `Tripzy/backend` to a Node host (e.g. Heroku, Railway, AWS EC2). Set env vars (DB, JWT, Maps, Razorpay). Use a production MySQL (e.g. AWS RDS, PlanetScale).
- **Frontend:** Run `npm run build` in `Tripzy/frontend`, then host the `build` folder on Netlify, Vercel, or same server. Set `REACT_APP_API_URL` and `REACT_APP_SOCKET_URL` to your live backend URL.
- **Database:** Use the same `database/schema.sql` on production MySQL. Do not commit `.env` files.

---

## File summary – where is what

| What                    | Location |
|-------------------------|----------|
| DB schema               | `database/schema.sql` |
| Backend entry           | `backend/server.js` |
| DB config               | `backend/config/db.js` |
| Auth (login/register)   | `backend/controllers/authController.js`, `backend/routes/authRoutes.js` |
| Ride APIs               | `backend/controllers/ridesController.js`, `backend/routes/rideRoutes.js` |
| Parcel APIs             | `backend/controllers/parcelsController.js`, `backend/routes/parcelRoutes.js` |
| Pooling APIs            | `backend/controllers/poolingController.js`, `backend/routes/poolingRoutes.js` |
| Payments (Razorpay)      | `backend/controllers/paymentsController.js`, `backend/routes/paymentRoutes.js` |
| Tracking + driver loc   | `backend/controllers/trackingController.js`, `backend/routes/trackingRoutes.js` |
| WebSocket               | `backend/socket/index.js` (driver-location broadcast) |
| Fare logic              | `backend/services/fareService.js` |
| OTP                     | `backend/services/otpService.js` |
| Maps (distance/duration)| `backend/services/mapsService.js` |
| Driver matching         | `backend/services/matchingService.js` |
| React app entry         | `frontend/src/App.js` |
| Auth context            | `frontend/src/context/AuthContext.js` |
| API client              | `frontend/src/services/api.js` |
| Socket client           | `frontend/src/services/socket.js` |
| Ride booking page       | `frontend/src/pages/RideBooking.js` |
| Parcel page             | `frontend/src/pages/ParcelDelivery.js` |
| Voice booking page      | `frontend/src/pages/VoiceBooking.js` |
| Pooling page            | `frontend/src/pages/RidePooling.js` |
| Real-time tracking page | `frontend/src/pages/RealTimeTracking.js` |

All of the above are already created in your Tripzy folder; follow this guide to install, configure, and run the project.
