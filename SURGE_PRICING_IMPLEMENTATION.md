# Surge Pricing Implementation - Peak Hours Only

## Overview
This document details the implementation of **peak hour-based surge pricing** for the Tripzy ride-booking system. Surge pricing is now applied only during specific peak hours and late-night high-demand periods, instead of being applicable all the time.

---

## Peak Hours Definition

### 1. **Morning Peak Hours**: 8:30 AM - 10:00 AM
- **Surge Multiplier**: 1.5x (50% increase)
- **Reason**: Morning commute rush time

### 2. **Evening Peak Hours**: 6:00 PM - 8:30 PM
- **Surge Multiplier**: 1.5x (50% increase)
- **Reason**: Evening commute rush time

### 3. **Late Night Period**: 10:00 PM - 6:00 AM
- **Base Surge Multiplier**: 1.3x (30% increase)
- **Dynamic Surge**: Additional surge based on active ride requests
  - If active requests > 5: Additional 10% per request (capped at +30%)
  - Example: 7 active requests = 1.3 + (0.1 × 2) = 1.5x multiplier

### 4. **Off-Peak Hours**: All other times
- **Surge Multiplier**: 1.0x (no surge)

---

## Backend Implementation

### File: [backend/services/fareService.js](backend/services/fareService.js)

**Key Functions:**

1. **`isPeakHour()`**
   - Checks if current time falls within morning (8:30-10 AM) or evening (6-8:30 PM) peak hours
   - Returns boolean
   - More precise: checks both hour and minutes

2. **`isLateNight()`**
   - Checks if current time is between 10:00 PM and 6:00 AM
   - Returns boolean
   - Used for dynamic surge pricing

3. **`getSurgeMultiplier(activeRideRequests)`**
   - **Parameters**: Number of active ride requests (pending/assigned/otp_verified)
   - **Returns**: Surge multiplier (1.0 = no surge, 1.5 = 50% surge, etc.)
   - **Logic**:
     ```
     If Peak Hour → return 1.5
     Else if Late Night:
       → return 1.3
       → if activeRequests > 5: add 0.1 per extra request (max +0.3)
     Else → return 1.0
     ```

4. **`calculateRideFare(distanceKm, durationMin, vehicleType, activeRideRequests)`**
   - Enhanced to accept `activeRideRequests` parameter
   - Now returns additional fields:
     - `isPeakHour`: boolean (true if peak hours)
     - `isLateNight`: boolean (true if late night)
   - **Fare Breakdown**:
     ```
     Subtotal = Base (₹50) + (Distance × ₹10) + (Duration × ₹1)
     Final Fare = Subtotal × Surge Multiplier
     ```

**Example Calculations:**

| Time | Distance | Duration | Base Calc | Surge | Final Fare |
|------|----------|----------|-----------|-------|-----------|
| 9:00 AM (Peak) | 5 km | 10 min | ₹50 + ₹50 + ₹10 = ₹110 | 1.5x | ₹165 |
| 2:00 PM (Off-Peak) | 5 km | 10 min | ₹50 + ₹50 + ₹10 = ₹110 | 1.0x | ₹110 |
| 11:30 PM (Late Night, 3 requests) | 5 km | 10 min | ₹50 + ₹50 + ₹10 = ₹110 | 1.3x | ₹143 |
| 11:30 PM (Late Night, 8 requests) | 5 km | 10 min | ₹50 + ₹50 + ₹10 = ₹110 | 1.6x | ₹176 |

---

### File: [backend/controllers/ridesController.js](backend/controllers/ridesController.js)

**New Function: `getActiveRideRequests()`**
- Queries database for rides in states: `pending`, `driver_assigned`, `otp_verified`
- Used to determine late-night dynamic surge
- Returns count of active requests (default 0 if error)

**Updated Functions:**

1. **`estimateFare()`** (Line ~22)
   - Now calls `getActiveRideRequests()` before calculating fare
   - Passes active request count to `calculateRideFare()`
   - Response includes:
     - `fare`: final calculated fare
     - `breakdown`: complete fare breakdown
     - `activeRideRequests`: current active requests count

2. **`createRide()`** (Line ~45)
   - Now calls `getActiveRideRequests()` before booking
   - Passes to `calculateRideFare()` for accurate surge calculation
   - Enhanced response includes `surgeInfo` object:
     ```json
     {
       "surgeInfo": {
         "isPeakHour": true/false,
         "isLateNight": true/false,
         "surgeMultiplier": 1.0-1.6,
         "baseFare": <subtotal before surge>
       }
     }
     ```

---

## Frontend Implementation

### File: [frontend/src/pages/RideBooking.js](frontend/src/pages/RideBooking.js)

**New State Variables:**
```javascript
const [surgeInfo, setSurgeInfo] = useState(null);
```

**Updated Functions:**

1. **`estimate()`** (Line ~29)
   - Now stores surge info from API response: `setSurgeInfo(data.breakdown)`
   - Updates UI to show surge pricing details

2. **Surge Pricing Display** (Line ~238)
   - New card component shows when `surgeInfo.surge > 1`
   - Displays:
     - 🔥 **SURGE PRICING ACTIVE** badge
     - Reason: "Peak Hours Detected" or "Late Night Demand"
     - Surge percentage: `(surge × 100 - 100)%`
     - Comparison: `Base: ₹X → ₹Y`
   - Uses gradient background (red/orange tones) to alert user

**Visual Display Example:**
```
Normal Fare Display (no surge):
┌─────────────────────────────┐
│ Fare: ₹110 | Distance: 5 km │
│ Duration: 10 min            │
└─────────────────────────────┘

Peak Hour with Surge:
┌─────────────────────────────┐
│ Fare: ₹165 | Distance: 5 km │
│ Duration: 10 min            │
└─────────────────────────────┘

🔥 SURGE PRICING ACTIVE
Peak Hours Detected
Surge: 50%
Base: ₹110 → ₹165
```

---

## API Response Changes

### Estimate Fare Endpoint
**Request**: `POST /api/rides/estimate`
```json
{
  "pickup_lat": 23.0225,
  "pickup_lng": 72.5714,
  "drop_lat": 23.0855,
  "drop_lng": 72.5433,
  "vehicle_type": "sedan"
}
```

**Response**:
```json
{
  "distanceKm": 5.2,
  "durationMin": 12,
  "fare": 165,
  "activeRideRequests": 3,
  "breakdown": {
    "base": 50,
    "distanceFare": 52,
    "timeFare": 12,
    "subtotal": 114,
    "surge": 1.5,
    "final": 171,
    "isPeakHour": true,
    "isLateNight": false
  }
}
```

### Create Ride Endpoint
**Request**: `POST /api/rides`

**Response** (includes surge info):
```json
{
  "rideId": 42,
  "fare": 171,
  "pickup_otp": "123456",
  "drop_otp": "654321",
  "nearbyDrivers": 3,
  "message": "Ride created. Share pickup OTP with driver to start.",
  "surgeInfo": {
    "isPeakHour": true,
    "isLateNight": false,
    "surgeMultiplier": 1.5,
    "baseFare": 114
  }
}
```

---

## Database Changes

**No schema changes required.**

The existing `rides` table's `fare` column stores the final calculated fare (after surge applied).

---

## Testing Scenarios

### Scenario 1: Morning Peak (8:30-10:00 AM)
- **Time**: 9:15 AM
- **Distance**: 5 km, Duration: 10 min
- **Calculation**: (50 + 50 + 10) × 1.5 = ₹165
- **Expected Surge**: 1.5x ✓

### Scenario 2: Off-Peak (3:00 PM)
- **Time**: 3:00 PM
- **Distance**: 5 km, Duration: 10 min
- **Calculation**: (50 + 50 + 10) × 1.0 = ₹110
- **Expected Surge**: 1.0x (No surge) ✓

### Scenario 3: Evening Peak (6:00-8:30 PM)
- **Time**: 7:30 PM
- **Distance**: 5 km, Duration: 10 min
- **Calculation**: (50 + 50 + 10) × 1.5 = ₹165
- **Expected Surge**: 1.5x ✓

### Scenario 4: Late Night - Low Demand (11:30 PM, 3 requests)
- **Time**: 11:30 PM
- **Distance**: 5 km, Duration: 10 min
- **Active Requests**: 3 (< 5, so no extra surge)
- **Calculation**: (50 + 50 + 10) × 1.3 = ₹143
- **Expected Surge**: 1.3x ✓

### Scenario 5: Late Night - High Demand (11:30 PM, 8 requests)
- **Time**: 11:30 PM
- **Distance**: 5 km, Duration: 10 min
- **Active Requests**: 8 (3 extra above 5, each adds 10%)
- **Surge**: 1.3 + (0.1 × 3 capped at 0.3) = 1.6x
- **Calculation**: (50 + 50 + 10) × 1.6 = ₹176
- **Expected Surge**: 1.6x ✓

---

## User Experience Improvements

1. ✅ **Transparent Pricing**: Users see surge pricing before booking
2. ✅ **Clear Breakdown**: Shows base fare vs. final fare after surge
3. ✅ **Visual Alerts**: Red/orange gradient card alerts user to surge
4. ✅ **Reason Display**: Shows reason for surge (Peak Hours / Late Night)
5. ✅ **Percentage Display**: Shows exact surge percentage (e.g., "+50%")

---

## Files Modified

1. **Backend**:
   - [backend/services/fareService.js](backend/services/fareService.js) - Surge logic implementation
   - [backend/controllers/ridesController.js](backend/controllers/ridesController.js) - API integration

2. **Frontend**:
   - [frontend/src/pages/RideBooking.js](frontend/src/pages/RideBooking.js) - Surge display UI

---

## Future Enhancements

1. **Driver-Specific Surge**: Apply different surge multipliers based on vehicle type
2. **Weather-Based Surge**: Add surge during rain/bad weather
3. **Geographic Surge**: Higher surge in specific high-demand zones
4. **Predictive Surge**: Use ML to predict demand spikes
5. **User Notifications**: Notify users when surge pricing is about to start
6. **History Analytics**: Show users historical surge patterns

---

## Summary

The surge pricing system is now **intelligent and user-friendly**:
- ✅ Only during specific peak hours (morning & evening commute)
- ✅ Dynamic late-night pricing based on demand
- ✅ Transparent to users before booking
- ✅ Clear visual indicators on the UI
- ✅ Accurate database tracking for analytics

This implementation ensures fair pricing while optimizing driver availability during high-demand periods.
