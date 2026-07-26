const pool = require('../config/db');
const { calculateRideFare, calculatePoolFareShare } = require('../services/fareService');
const { getDistanceAndDuration } = require('../services/mapsService');
const { findNearbyDrivers } = require('../services/matchingService');
const { saveOTP } = require('../services/otpService');

// Create a pool ride (driver creates or user requests pool)
const createPoolRide = async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, drop_lat, drop_lng, pickup_address, drop_address, vehicle_type } = req.body;
    const userId = req.user.id;
    const { distanceKm, durationMin } = await getDistanceAndDuration(pickup_lat, pickup_lng, drop_lat, drop_lng);
    const fareBreakdown = calculateRideFare(distanceKm, durationMin, vehicle_type);
    const totalFare = fareBreakdown.final;
    const fareShare = calculatePoolFareShare(totalFare, 1);
    const [rideResult] = await pool.query(
      `INSERT INTO rides (user_id, pickup_lat, pickup_lng, drop_lat, drop_lng, pickup_address, drop_address, distance_km, duration_min, fare, vehicle_type, is_pooling)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [userId, pickup_lat, pickup_lng, drop_lat, drop_lng, pickup_address || null, drop_address || null, distanceKm, durationMin, totalFare, vehicle_type || 'sedan']
    );
    const rideId = rideResult.insertId;
    await pool.query(
      'INSERT INTO ride_pools (ride_id, user_id, pickup_lat, pickup_lng, drop_lat, drop_lng, fare_share, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [rideId, userId, pickup_lat, pickup_lng, drop_lat, drop_lng, fareShare, 'joined']
    );
    const pickupOtp = await saveOTP(req.user.phone, 'pickup', rideId);
    const dropOtp = await saveOTP(req.user.phone, 'drop', rideId);
    await pool.query('UPDATE rides SET pickup_otp = ?, drop_otp = ? WHERE id = ?', [pickupOtp, dropOtp, rideId]);
    const drivers = await findNearbyDrivers(pickup_lat, pickup_lng, vehicle_type, 3);
    res.status(201).json({
      rideId,
      fareShare,
      totalFare,
      pickup_otp: pickupOtp,
      drop_otp: dropOtp,
      nearbyDrivers: drivers.length,
      message: 'Pool ride created.'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Join existing pool (find pool with same route and add user)
const joinPool = async (req, res) => {
  try {
    const { ride_id } = req.body;
    const userId = req.user.id;
    const [rides] = await pool.query('SELECT * FROM rides WHERE id = ? AND is_pooling = 1 AND status = ?', [ride_id, 'pending']);
    if (!rides.length) return res.status(404).json({ error: 'Pool ride not found or not open.' });
    const ride = rides[0];
    const [pools] = await pool.query('SELECT * FROM ride_pools WHERE ride_id = ?', [ride_id]);
    const totalPassengers = pools.length + 1;
    const newFareShare = calculatePoolFareShare(ride.fare, totalPassengers);
    await pool.query(
      'INSERT INTO ride_pools (ride_id, user_id, pickup_lat, pickup_lng, drop_lat, drop_lng, fare_share, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [ride_id, userId, ride.pickup_lat, ride.pickup_lng, ride.drop_lat, ride.drop_lng, newFareShare, 'joined']
    );
    res.json({ message: 'Joined pool.', fareShare: newFareShare });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// List available pools (for join)
const listPools = async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const [rows] = await pool.query(
      `SELECT r.id, r.pickup_address, r.drop_address, r.fare, r.created_at,
              (SELECT COUNT(*) FROM ride_pools WHERE ride_id = r.id AND status = 'joined') as passengers
       FROM rides r WHERE r.is_pooling = 1 AND r.status = 'pending' AND r.driver_id IS NULL
       ORDER BY r.created_at DESC LIMIT 20`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const simulateJoin = async (req, res) => {
  try {
    const { rideId } = req.body;
    if (!rideId) return res.status(400).json({ error: 'rideId is required.' });

    // 1. Get the ride
    const [rides] = await pool.query('SELECT * FROM rides WHERE id = ? AND is_pooling = 1 AND status = ?', [rideId, 'pending']);
    if (!rides.length) return res.status(404).json({ error: 'Pooling ride not found or not active.' });
    const ride = rides[0];

    // 2. Find passengers already in this pool to avoid duplicates
    const [existingPools] = await pool.query('SELECT user_id FROM ride_pools WHERE ride_id = ?', [rideId]);
    const existingUserIds = existingPools.map(p => p.user_id);

    // 3. Find a mock user to join (e.g. Priya Patel, Rahul Mehta, Sneha Reddy)
    const [mockUsers] = await pool.query('SELECT id, name, phone FROM users WHERE email IN ("priya@tripzy.com", "rahul@tripzy.com", "sneha@tripzy.com")');
    const availableMockUser = mockUsers.find(u => !existingUserIds.includes(u.id));

    if (!availableMockUser) {
      return res.status(400).json({ error: 'No more mock users available to join this pool.' });
    }

    // 4. Calculate new fare share
    const totalPassengers = existingUserIds.length + 1;
    const newFareShare = calculatePoolFareShare(ride.fare, totalPassengers);

    // 5. Insert the mock passenger
    await pool.query(
      'INSERT INTO ride_pools (ride_id, user_id, pickup_lat, pickup_lng, drop_lat, drop_lng, fare_share, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [rideId, availableMockUser.id, ride.pickup_lat, ride.pickup_lng, ride.drop_lat, ride.drop_lng, newFareShare, 'joined']
    );

    // 6. Update fare share of all other members in the pool
    await pool.query('UPDATE ride_pools SET fare_share = ? WHERE ride_id = ?', [newFareShare, rideId]);

    // 7. Emit socket.io event to notify pool members
    try {
      const { getIo } = require('../socket/index');
      const io = getIo();
      if (io) {
        io.to(`ride:${rideId}`).emit('pool-joined', {
          userName: availableMockUser.name,
          fareShare: newFareShare,
          totalPassengers
        });
        // Also emit status-update to force reload
        io.to(`ride:${rideId}`).emit('status-update', { status: 'pending' });
      }
    } catch (sockErr) {
      console.warn('Socket emit failed during mock join:', sockErr.message);
    }

    res.json({
      message: 'Simulated passenger joined.',
      userName: availableMockUser.name,
      fareShare: newFareShare
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { createPoolRide, joinPool, listPools, simulateJoin };
