const pool = require('../config/db');

const submitRating = async (req, res) => {
  try {
    const { ride_id, rating, comment } = req.body;
    const userId = req.user.id;
    const [r] = await pool.query('SELECT driver_id FROM rides WHERE id = ? AND user_id = ? AND status = ?', [ride_id, userId, 'completed']);
    if (!r.length) return res.status(404).json({ error: 'Ride not found or not completed.' });
    const driverId = r[0].driver_id;
    await pool.query('INSERT INTO ratings (ride_id, user_id, driver_id, rating, comment) VALUES (?, ?, ?, ?, ?)', [ride_id, userId, driverId, rating, comment || null]);
    const [avg] = await pool.query('SELECT AVG(rating) as avg_rating FROM ratings WHERE driver_id = ?', [driverId]);
    await pool.query('UPDATE drivers SET rating = ? WHERE id = ?', [avg[0].avg_rating.toFixed(2), driverId]);
    res.json({ message: 'Rating submitted.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { submitRating };
