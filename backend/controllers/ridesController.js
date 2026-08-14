const pool = require('../config/db');
const { getDistanceAndDuration } = require('../services/mapsService');
const { calculateRideFare, calculatePoolFareShare } = require('../services/fareService');
const { findNearbyDrivers } = require('../services/matchingService');
const { saveOTP, verifyOTP } = require('../services/otpService');
const { emitToDriver } = require('../socket');

// Get count of active ride requests (for surge pricing)
const getActiveRideRequests = async () => {
  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) as count FROM rides WHERE status IN ('pending', 'driver_assigned', 'otp_verified')"
    );
    return rows[0].count || 0;
  } catch (e) {
    console.error('Error getting active ride requests:', e);
    return 0;
  }
};

// Suggest vehicle types based on luggage size and simple heuristics
const getVehicleSuggestions = (luggageSize = 'small') => {
  const size = (luggageSize || 'small').toLowerCase();
  if (size === 'small') return ['bike', 'auto', 'hatchback'];
  if (size === 'medium') return ['auto', 'hatchback', 'sedan'];
  if (size === 'large') return ['sedan', 'suv'];
  return ['sedan'];
};

// Estimate fare (no booking)
const estimateFare = async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, drop_lat, drop_lng, vehicle_type, luggage_size } = req.body;
    const { distanceKm, durationMin } = await getDistanceAndDuration(pickup_lat, pickup_lng, drop_lat, drop_lng);
    const activeRequests = await getActiveRideRequests();
    const fare = calculateRideFare(distanceKm, durationMin, vehicle_type, activeRequests, luggage_size);
    const suggestions = getVehicleSuggestions(luggage_size);
    res.json({ distanceKm, durationMin, fare: fare.final, breakdown: fare, activeRideRequests: activeRequests, suggestions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Create ride (book)
const createRide = async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, drop_lat, drop_lng, pickup_address, drop_address, vehicle_type, luggage_size, is_pooling, scheduled_at } = req.body;
    const userId = req.user.id;
    const { distanceKm, durationMin } = await getDistanceAndDuration(pickup_lat, pickup_lng, drop_lat, drop_lng);
    const activeRequests = await getActiveRideRequests();
    const fareBreakdown = calculateRideFare(distanceKm, durationMin, vehicle_type, activeRequests, luggage_size);
    
    // MySQL format scheduled_at
    const formattedScheduledAt = scheduled_at ? new Date(scheduled_at).toISOString().slice(0, 19).replace('T', ' ') : null;
    const isFutureScheduled = formattedScheduledAt && (new Date(scheduled_at).getTime() - Date.now() > 10 * 60 * 1000);

    const [result] = await pool.query(
      `INSERT INTO rides (user_id, pickup_lat, pickup_lng, drop_lat, drop_lng, pickup_address, drop_address, distance_km, duration_min, fare, vehicle_type, luggage_size, is_pooling, scheduled_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, pickup_lat, pickup_lng, drop_lat, drop_lng, pickup_address || null, drop_address || null, distanceKm, durationMin, fareBreakdown.final, vehicle_type || 'sedan', luggage_size || null, is_pooling ? 1 : 0, formattedScheduledAt]
    );
    const rideId = result.insertId;
    const pickupOtp = await saveOTP(req.user.phone, 'pickup', rideId);
    const dropOtp = await saveOTP(req.user.phone, 'drop', rideId);
    await pool.query('UPDATE rides SET pickup_otp = ?, drop_otp = ? WHERE id = ?', [pickupOtp, dropOtp, rideId]);
    
    let driversCount = 0;
    if (!isFutureScheduled) {
      const drivers = await findNearbyDrivers(pickup_lat, pickup_lng, vehicle_type, 3);
      driversCount = drivers.length;

      // Notify nearby drivers via WebSocket
      drivers.forEach((driver) => {
        emitToDriver(driver.id, 'new-ride', {
          rideId,
          pickup_lat,
          pickup_lng,
          drop_lat,
          drop_lng,
          pickup_address,
          drop_address,
          fare: fareBreakdown.final,
          distance_km: distanceKm,
          duration_min: durationMin,
          vehicle_type: vehicle_type || 'sedan',
          luggage_size: luggage_size || null,
          is_pooling: is_pooling ? 1 : 0
        });
      });
    }

    res.status(201).json({
      rideId,
      fare: fareBreakdown.final,
      pickup_otp: pickupOtp,
      drop_otp: dropOtp,
      nearbyDrivers: driversCount,
      isScheduled: !!isFutureScheduled,
      scheduledAt: formattedScheduledAt,
      message: isFutureScheduled 
        ? 'Ride scheduled successfully. Drivers will be assigned closer to departure.' 
        : 'Ride created. Share pickup OTP with driver to start.',
      surgeInfo: {
        isPeakHour: fareBreakdown.isPeakHour,
        isLateNight: fareBreakdown.isLateNight,
        surgeMultiplier: fareBreakdown.surge,
        baseFare: fareBreakdown.subtotal
      },
      luggageInfo: {
        luggageSize: fareBreakdown.luggageSize,
        luggageMultiplier: fareBreakdown.luggageMultiplier,
        luggageCharge: fareBreakdown.final - Math.round(fareBreakdown.surgeAdjustedFare)
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Assign driver (accept ride)
const assignDriver = async (req, res) => {
  try {
    const { rideId } = req.params;
    const driverId = req.body.driver_id || req.driverId;
    const [rows] = await pool.query('SELECT * FROM rides WHERE id = ? AND status = ?', [rideId, 'pending']);
    if (!rows.length) return res.status(404).json({ error: 'Ride not found or already assigned.' });
    await pool.query('UPDATE rides SET driver_id = ?, status = ? WHERE id = ?', [driverId, 'driver_assigned', rideId]);
    await pool.query('UPDATE drivers SET is_available = 0 WHERE id = ?', [driverId]);

    // Notify driver of assignment
    emitToDriver(driverId, 'ride-assigned', { rideId });

    res.json({ message: 'Driver assigned.', rideId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Verify pickup OTP → start trip
const verifyPickupOTP = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { otp } = req.body;
    const [rides] = await pool.query('SELECT * FROM rides WHERE id = ?', [rideId]);
    if (!rides.length) return res.status(404).json({ error: 'Ride not found.' });
    const ride = rides[0];
    const [user] = await pool.query('SELECT phone FROM users WHERE id = ?', [ride.user_id]);
    const phone = user[0]?.phone;
    const valid = await verifyOTP(phone, otp, 'pickup', parseInt(rideId));
    if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP.' });
    await pool.query('UPDATE rides SET status = ?, started_at = NOW() WHERE id = ?', ['in_progress', rideId]);
    res.json({ message: 'Trip started.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Verify drop OTP → complete trip
const verifyDropOTP = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { otp } = req.body;
    const [rides] = await pool.query('SELECT * FROM rides WHERE id = ?', [rideId]);
    if (!rides.length) return res.status(404).json({ error: 'Ride not found.' });
    const ride = rides[0];
    const [user] = await pool.query('SELECT phone FROM users WHERE id = ?', [ride.user_id]);
    const valid = await verifyOTP(user[0]?.phone, otp, 'drop', parseInt(rideId));
    if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP.' });
    await pool.query('UPDATE rides SET status = ?, completed_at = NOW() WHERE id = ?', ['completed', rideId]);
    await pool.query('UPDATE drivers SET is_available = 1, total_trips = total_trips + 1 WHERE id = ?', [ride.driver_id]);
    res.json({ message: 'Trip completed.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// List user's rides
const myRides = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT r.*, u.name as user_name, d.vehicle_number FROM rides r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN drivers d ON r.driver_id = d.id WHERE r.user_id = ? ORDER BY r.created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Get single ride (for tracking)
const getRide = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT r.*, u.name as user_name, u.phone as user_phone FROM rides r JOIN users u ON r.user_id = u.id WHERE r.id = ?',
      [req.params.rideId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Ride not found.' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Cancel ride
const cancelRide = async (req, res) => {
  try {
    const [r] = await pool.query('SELECT * FROM rides WHERE id = ? AND user_id = ?', [req.params.rideId, req.user.id]);
    if (!r.length) return res.status(404).json({ error: 'Ride not found.' });
    if (!['pending', 'driver_assigned'].includes(r[0].status)) {
      return res.status(400).json({ error: 'Cannot cancel ride in current status.' });
    }
    await pool.query('UPDATE rides SET status = ? WHERE id = ?', ['cancelled', req.params.rideId]);
    if (r[0].driver_id) await pool.query('UPDATE drivers SET is_available = 1 WHERE id = ?', [r[0].driver_id]);
    res.json({ message: 'Ride cancelled.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getRideChats = async (req, res) => {
  try {
    const { rideId } = req.params;
    const [rows] = await pool.query(
      `SELECT c.id, c.ride_id, c.sender_id, c.message, c.created_at, u.name as sender_name 
       FROM ride_chats c 
       JOIN users u ON c.sender_id = u.id 
       WHERE c.ride_id = ? 
       ORDER BY c.created_at ASC`,
      [rideId]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const checkScheduledRides = async () => {
  try {
    const [scheduled] = await pool.query(
      `SELECT * FROM rides 
       WHERE status = 'pending' 
         AND scheduled_at IS NOT NULL 
         AND scheduled_at <= DATE_ADD(NOW(), INTERVAL 15 MINUTE)
         AND scheduled_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)`
    );

    if (scheduled.length === 0) return;
    console.log(`[Auto-Dispatcher] Found ${scheduled.length} scheduled rides ready for dispatch.`);

    for (const ride of scheduled) {
      const drivers = await findNearbyDrivers(ride.pickup_lat, ride.pickup_lng, ride.vehicle_type, 3);
      if (drivers.length > 0) {
        console.log(`[Auto-Dispatcher] Dispatching scheduled ride #${ride.id} to ${drivers.length} drivers.`);
        
        drivers.forEach((driver) => {
          emitToDriver(driver.id, 'new-ride', {
            rideId: ride.id,
            pickup_lat: ride.pickup_lat,
            pickup_lng: ride.pickup_lng,
            drop_lat: ride.drop_lat,
            drop_lng: ride.drop_lng,
            pickup_address: ride.pickup_address,
            drop_address: ride.drop_address,
            fare: ride.fare,
            distance_km: ride.distance_km,
            duration_min: ride.duration_min,
            vehicle_type: ride.vehicle_type,
            luggage_size: ride.luggage_size,
            is_pooling: ride.is_pooling
          });
        });

        try {
          const { getIo } = require('../socket');
          const io = getIo();
          if (io) {
            io.to(`ride:${ride.id}`).emit('status-update', { status: 'pending', searching: true });
          }
        } catch (sockErr) {
          console.warn('Auto-dispatcher socket emit failed:', sockErr.message);
        }
      }
    }
  } catch (e) {
    console.error('[Auto-Dispatcher] Error during scheduled dispatch check:', e.message);
  }
};

module.exports = { estimateFare, createRide, assignDriver, verifyPickupOTP, verifyDropOTP, myRides, getRide, cancelRide, getRideChats, checkScheduledRides };
