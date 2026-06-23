const pool = require('../config/db');
const { verifyOTP } = require('../services/otpService');
const { haversineDistance } = require('../services/matchingService');

const getDriverByUserId = async (userId) => {
  const [rows] = await pool.query('SELECT * FROM drivers WHERE user_id = ?', [userId]);
  return rows[0] || null;
};

const getDashboard = async (req, res) => {
  try {
    const driver = await getDriverByUserId(req.user.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found.' });
    }

    const [activeRides] = await pool.query(
      "SELECT COUNT(*) as count FROM rides WHERE driver_id = ? AND status IN ('pending', 'driver_assigned', 'otp_verified', 'in_progress')",
      [driver.id]
    );

    const [completedEarnings] = await pool.query(
      "SELECT COALESCE(SUM(fare), 0) as total FROM rides WHERE driver_id = ? AND status = 'completed'",
      [driver.id]
    );

    // Earnings breakdown for last 6 months
    const [earningsByMonthRows] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COALESCE(SUM(fare),0) as earnings, COUNT(*) as trips
       FROM rides
       WHERE driver_id = ? AND status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY month
       ORDER BY month`,
      [driver.id]
    );

    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toISOString().slice(0, 7);
      months.push(monthKey);
    }

    const earningsByMonth = months.map((m) => {
      const row = earningsByMonthRows.find((r) => r.month === m);
      return {
        month: m,
        earnings: row ? Number(row.earnings) : 0,
        trips: row ? Number(row.trips) : 0
      };
    });

    const [rides] = await pool.query(
      `SELECT r.*, u.name as rider_name, u.phone as rider_phone
       FROM rides r
       JOIN users u ON r.user_id = u.id
       WHERE r.driver_id = ?
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [driver.id]
    );

    res.json({
      driver,
      stats: {
        activeRides: activeRides[0].count || 0,
        earnings: completedEarnings[0].total || 0,
        totalTrips: driver.total_trips || 0,
        rating: driver.rating || 0
      },
      earningsByMonth,
      rides
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getMatchingRides = async (req, res) => {
  try {
    const driver = await getDriverByUserId(req.user.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found.' });
    }

    const [locRows] = await pool.query(
      'SELECT latitude, longitude FROM driver_locations WHERE driver_id = ? ORDER BY updated_at DESC LIMIT 1',
      [driver.id]
    );
    const lastLoc = locRows[0];
    if (!lastLoc) {
      return res.status(400).json({ error: 'No driver location found. Share your location first.' });
    }

    const [pendingRides] = await pool.query(
      "SELECT r.*, u.name as rider_name FROM rides r JOIN users u ON r.user_id = u.id WHERE r.status = 'pending' ORDER BY r.created_at DESC LIMIT 200"
    );

    const nearby = pendingRides
      .map((ride) => {
        const dist = haversineDistance(lastLoc.latitude, lastLoc.longitude, ride.pickup_lat, ride.pickup_lng);
        return { ...ride, distance_km: Number(dist.toFixed(2)) };
      })
      .filter((r) => r.distance_km <= 5)
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 25);

    res.json(nearby);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const driver = await getDriverByUserId(req.user.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found.' });
    }

    const { is_online, is_available } = req.body;

    const updates = [];
    const params = [];
    if (typeof is_online === 'boolean') {
      updates.push('is_online = ?');
      params.push(is_online ? 1 : 0);
    }
    if (typeof is_available === 'boolean') {
      updates.push('is_available = ?');
      params.push(is_available ? 1 : 0);
    }

    if (!updates.length) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    params.push(driver.id);
    await pool.query(`UPDATE drivers SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updated] = await pool.query('SELECT * FROM drivers WHERE id = ?', [driver.id]);
    res.json({ driver: updated[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const acceptRide = async (req, res) => {
  try {
    const driver = await getDriverByUserId(req.user.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found.' });
    }

    const rideId = req.params.rideId;
    const [rides] = await pool.query('SELECT * FROM rides WHERE id = ? AND status = ?', [rideId, 'pending']);
    if (!rides.length) {
      return res.status(404).json({ error: 'Ride not found or cannot be accepted.' });
    }

    await pool.query('UPDATE rides SET driver_id = ?, status = ? WHERE id = ?', [driver.id, 'driver_assigned', rideId]);
    await pool.query('UPDATE drivers SET is_available = 0 WHERE id = ?', [driver.id]);

    const [ride] = await pool.query('SELECT * FROM rides WHERE id = ?', [rideId]);
    res.json({ ride: ride[0], message: 'Ride accepted. Awaiting pickup OTP.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const updateRideStatus = async (req, res) => {
  try {
    const driver = await getDriverByUserId(req.user.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found.' });
    }

    const rideId = req.params.rideId;
    const { action, otp } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Action is required (start | complete).' });
    }

    const [rides] = await pool.query('SELECT * FROM rides WHERE id = ? AND driver_id = ?', [rideId, driver.id]);
    if (!rides.length) {
      return res.status(404).json({ error: 'Ride not found or not assigned to you.' });
    }

    const ride = rides[0];

    if (action === 'start') {
      if (!otp) {
        return res.status(400).json({ error: 'OTP required to start the ride.' });
      }
      const [user] = await pool.query('SELECT phone FROM users WHERE id = ?', [ride.user_id]);
      const phone = user[0]?.phone;
      const valid = await verifyOTP(phone, otp, 'pickup', parseInt(rideId, 10));
      if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP.' });

      await pool.query('UPDATE rides SET status = ?, started_at = NOW() WHERE id = ?', ['in_progress', rideId]);
      return res.json({ message: 'Ride started. Safe driving!' });
    }

    if (action === 'complete') {
      if (!otp) {
        return res.status(400).json({ error: 'OTP required to complete the ride.' });
      }
      const [user] = await pool.query('SELECT phone FROM users WHERE id = ?', [ride.user_id]);
      const phone = user[0]?.phone;
      const valid = await verifyOTP(phone, otp, 'drop', parseInt(rideId, 10));
      if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP.' });

      await pool.query('UPDATE rides SET status = ?, completed_at = NOW() WHERE id = ?', ['completed', rideId]);
      await pool.query('UPDATE drivers SET is_available = 1, total_trips = total_trips + 1 WHERE id = ?', [driver.id]);
      return res.json({ message: 'Ride completed. Great job!' });
    }

    res.status(400).json({ error: 'Unknown action.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { getDashboard, getMatchingRides, updateAvailability, acceptRide, updateRideStatus };
