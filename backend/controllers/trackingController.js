const pool = require('../config/db');

const getRideForTracking = async (req, res) => {
  try {
    const [ride] = await pool.query(
      'SELECT r.*, d.vehicle_number, d.rating as driver_rating, u.name as driver_name, u.phone as driver_phone FROM rides r LEFT JOIN drivers d ON r.driver_id = d.id LEFT JOIN users u ON d.user_id = u.id WHERE r.id = ?',
      [req.params.rideId]
    );
    if (!ride.length) return res.status(404).json({ error: 'Ride not found.' });
    const [loc] = await pool.query('SELECT latitude, longitude, updated_at FROM driver_locations WHERE driver_id = ? ORDER BY updated_at DESC LIMIT 1', [ride[0].driver_id]);
    res.json({ ...ride[0], driverLocation: loc[0] || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const updateDriverLocation = async (req, res) => {
  try {
    let driverId = req.body.driver_id;

    // If the request comes from a logged in driver, use their driver record.
    if (!driverId && req.user?.role === 'driver') {
      const [driverRows] = await pool.query('SELECT id FROM drivers WHERE user_id = ?', [req.user.id]);
      driverId = driverRows[0]?.id;
    }

    const { latitude, longitude } = req.body;
    if (!driverId || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'driver_id, latitude, longitude required.' });
    }
    await pool.query('INSERT INTO driver_locations (driver_id, latitude, longitude) VALUES (?, ?, ?)', [driverId, latitude, longitude]);
    res.json({ message: 'Location updated.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { getRideForTracking, updateDriverLocation };
