# Tripzy - Smart Ride & Parcel Delivery Platform

A full-stack web application for ride booking and parcel delivery with real-time tracking, ride pooling, and voice booking capabilities.

## Project Structure

```
Tripzy/
├── backend/          # Node.js + Express API server
├── frontend/         # React web application
├── database/         # SQL schema
└── README_SETUP.md   # This file
```

## Prerequisites

- **Node.js**: v24.13.0 or higher
- **npm**: 11.6.2 or higher
- **MySQL**: 5.7+ (for database, if running locally)

Verify installation:
```cmd
node -v
npm -v
```

## Environment Setup

### Backend Configuration

Navigate to the backend folder and create a `.env` file (if needed):

```cmd
cd backend
```

Default environment variables (from `backend/config/db.js`):
- `DB_HOST`: localhost
- `DB_USER`: root
- `DB_PASSWORD`: Rekha05 (hardcoded default)
- `DB_NAME`: tripzy_db
- `PORT`: 5000 (default)
- `JWT_SECRET`: tripzy_secret (default)

### Frontend Configuration

The frontend uses `.env` with:
- `REACT_APP_API_URL`: http://localhost:5000/api
- `REACT_APP_SOCKET_URL`: http://localhost:5000
- `REACT_APP_GOOGLE_MAPS_API_KEY`: Your Google Maps API key

**Note**: The Google Maps API key is already set in `frontend/.env` and will be injected via the environment variable placeholder in `frontend/public/index.html`.

## Installation & Setup

### 1. Install Backend Dependencies

```cmd
cd backend
npm install
```

### 2. Install Frontend Dependencies

```cmd
cd frontend
npm install
```

### 3. Set Up Database

- Import `database/schema.sql` into your MySQL instance:
  ```cmd
  mysql -u root -p tripzy_db < database/schema.sql
  ```

## Running the Project

### Option 1: Run Backend Only

```cmd
cd backend
npm run dev
```

Server will start on `http://localhost:5000`

Health check endpoint:
```cmd
curl http://localhost:5000/api/health
```

### Option 2: Run Frontend Only

```cmd
cd frontend
npm start
```

App will open at `http://localhost:3000` in your browser.

### Option 3: Run Both (Recommended)

Open **two separate terminal windows**:

**Terminal 1 - Backend:**
```cmd
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```cmd
cd frontend
npm start
```

The frontend will automatically connect to the backend API at `http://localhost:5000/api`.

## Available Scripts

### Backend

- `npm run dev` - Start dev server with auto-reload (uses nodemon)
- `npm start` - Start production server

### Frontend

- `npm start` - Start dev server with hot reload on port 3000
- `npm run build` - Create production-optimized build
- `npm test` - Run tests (if configured)
- `npm run eject` - Eject from Create React App (not reversible)

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Backend health check |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/rides` | Book a ride |
| POST | `/api/rides/estimate` | Estimate fare |
| POST | `/api/parcels` | Create parcel delivery |
| GET | `/api/parcels/my` | List user's parcels |
| GET | `/api/tracking/:rideId` | Real-time ride tracking |

## Troubleshooting

### Error: `'react-scripts' is not recognized`

**Solution**: Install dependencies in the frontend folder:
```cmd
cd frontend
npm install
```

### Error: `listen EADDRINUSE: address already in use :::5000`

**Solution**: Either:
1. Kill the process using port 5000:
   ```cmd
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```
2. Or change the backend port:
   ```cmd
   set PORT=5001
   npm run dev
   ```

### Frontend can't connect to backend

**Solution**: Ensure:
1. Backend is running on `http://localhost:5000`
2. Frontend `.env` has correct `REACT_APP_API_URL`
3. Check browser console (F12) for CORS or network errors

### PowerShell execution policy blocks npm commands

**Solution 1** - Allow scripts for current user (Admin PowerShell):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Solution 2** - Use Command Prompt (cmd) instead of PowerShell:
```cmd
cd frontend
npm start
```

### Google Maps not loading

**Solution**: Ensure `REACT_APP_GOOGLE_MAPS_API_KEY` is set in `frontend/.env`:
```
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyBGULGcG9NWbk5jPXkOHEIS1xG3Lj7TM6o
```

Then restart the frontend dev server.

## Fixed Issues

The following issues were identified and fixed:

1. **Missing Icon Imports**: Replaced unsupported Feather icons (`FiWeight`, `FiLuggage`) with available alternatives (`FiBox`, `FiPackage`) in:
   - `frontend/src/pages/MyParcels.js`
   - `frontend/src/pages/ParcelDelivery.js`
   - `frontend/src/pages/RideBooking.js`

2. **Google Maps API Key**: Moved from hardcoded to environment variable placeholder in `frontend/public/index.html`

3. **API URL Configuration**: Ensured frontend respects `REACT_APP_API_URL` environment variable

## Project Features

- ✅ User registration and authentication (JWT)
- ✅ Ride booking with real-time GPS tracking
- ✅ Parcel delivery management
- ✅ Ride pooling option
- ✅ Voice-based ride booking
- ✅ Payment integration (Razorpay)
- ✅ Real-time notifications (Socket.IO)
- ✅ Admin dashboard
- ✅ User ratings and reviews
- ✅ Responsive UI with React

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- The backend uses MySQL and requires a database connection
- WebSocket server runs on the same port as the REST API (5000)
- Frontend runs on a separate dev server (3000) with hot module reloading
- Google Maps API requires an active key for location services

## Support

For issues or questions, check the terminal output and browser console (F12) for error messages.
