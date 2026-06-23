# Surge Pricing Quick Reference

## ⏰ Peak Hours & Multipliers

| Time Period | Surge Multiplier | Notes |
|-------------|-----------------|-------|
| **8:30 AM - 10:00 AM** | 1.5x (50%) | Morning commute |
| **6:00 PM - 8:30 PM** | 1.5x (50%) | Evening commute |
| **10:00 PM - 6:00 AM** | 1.3x - 1.6x | Late night (dynamic based on demand) |
| **All Other Times** | 1.0x (No surge) | Normal pricing |

---

## 💰 Fare Calculation Formula

```
Base Fare = ₹50
Distance Fare = Distance (km) × ₹10/km
Time Fare = Duration (min) × ₹1/min

Subtotal = Base + Distance Fare + Time Fare

Final Fare = Subtotal × Surge Multiplier (1.0 - 1.6)
```

---

## 📊 Example Fares (5 km, 10 min ride)

| Time | Subtotal | Surge | Final Fare |
|------|----------|-------|-----------|
| 9:00 AM (Peak) | ₹110 | 1.5x | **₹165** |
| 3:00 PM (Off-peak) | ₹110 | 1.0x | **₹110** |
| 7:00 PM (Peak) | ₹110 | 1.5x | **₹165** |
| 11:00 PM (Late night, normal demand) | ₹110 | 1.3x | **₹143** |
| 11:00 PM (Late night, high demand) | ₹110 | 1.6x | **₹176** |

---

## 🚀 Late Night Dynamic Surge

When bookings are made between **10:00 PM - 6:00 AM**:

- **Base Late Night Surge**: 1.3x (30%)
- **Active Requests 1-5**: Stay at 1.3x
- **Active Requests 6-8**: Increase by 0.1x per request (max 1.6x)
- **Active Requests 9+**: Cap at 1.6x (60% surge)

**Formula**: `Surge = 1.3 + min(0.1 × (activeRequests - 5), 0.3)`

---

## 🎨 Frontend Changes

**Ride Booking page now displays**:
- ✅ Normal fare breakdown (base + distance + time)
- ✅ **Surge pricing card** (only when surge > 1.0x)
  - Shows "🔥 SURGE PRICING ACTIVE" badge
  - Displays reason: "Peak Hours Detected" or "Late Night Demand"
  - Shows surge percentage and comparison

---

## 🔧 Backend Changes

### fareService.js
- `isPeakHour()` - Check morning/evening peak
- `isLateNight()` - Check late night (10 PM - 6 AM)
- `getSurgeMultiplier(activeRideRequests)` - Get surge based on time & demand
- `calculateRideFare()` - Enhanced with surge calculation

### ridesController.js
- `getActiveRideRequests()` - Count active ride requests
- `estimateFare()` - Includes surge info in response
- `createRide()` - Books with correct surge pricing

---

## 📱 API Response Example

**GET /api/rides/estimate**

```json
{
  "distanceKm": 5.2,
  "durationMin": 12,
  "fare": 171,
  "activeRideRequests": 3,
  "breakdown": {
    "base": 50,
    "distanceFare": 52,
    "timeFare": 12,
    "subtotal": 114,
    "surge": 1.5,
    "isPeakHour": true,
    "isLateNight": false
  }
}
```

---

## ✅ What's Working

✓ Morning peak hours (8:30-10 AM) → 1.5x surge  
✓ Evening peak hours (6-8:30 PM) → 1.5x surge  
✓ Late night dynamic surge (10 PM-6 AM) based on demand  
✓ Off-peak hours → No surge  
✓ Frontend displays surge info clearly  
✓ Users see surge before booking  
✓ Transparent breakdown shown  

---

## 🧪 Testing Commands

**Morning Peak Test** (set system time to 9:15 AM)
```javascript
// Expected: surge = 1.5x
const fare = calculateRideFare(5, 10, 'sedan', 2);
// Should return: { ..., surge: 1.5, final: 165 }
```

**Late Night High Demand Test** (set system time to 11 PM)
```javascript
// Expected: surge = 1.6x (1.3 + 0.3)
const fare = calculateRideFare(5, 10, 'sedan', 8);
// Should return: { ..., surge: 1.6, final: 176 }
```

**Off-Peak Test** (set system time to 3 PM)
```javascript
// Expected: surge = 1.0x (no surge)
const fare = calculateRideFare(5, 10, 'sedan', 0);
// Should return: { ..., surge: 1.0, final: 110 }
```

---

## 📋 Files Changed

1. `backend/services/fareService.js` - Surge logic
2. `backend/controllers/ridesController.js` - API endpoints
3. `frontend/src/pages/RideBooking.js` - UI display

---

## 🎯 How Users Will See It

**Step 1**: Enter pickup & drop location  
**Step 2**: Click "Estimate Fare"  
**Step 3**: See fare breakdown + surge info (if applicable)  
```
Normal Fare: ₹110
🔥 SURGE PRICING: Peak Hours Detected (+50%)
Final Fare: ₹165
```
**Step 4**: Click "Book Ride" to proceed  
**Step 5**: OTP displayed in modal
