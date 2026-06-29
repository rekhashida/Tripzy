const pool = require('../config/db');
const { sendSMS } = require('../services/smsService');

const getStats = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT COUNT(*) as c FROM users WHERE role = ?', ['user']);
    const [drivers] = await pool.query('SELECT COUNT(*) as c FROM drivers');
    const [rides] = await pool.query('SELECT COUNT(*) as c FROM rides WHERE status = ?', ['completed']);
    const [parcels] = await pool.query('SELECT COUNT(*) as c FROM parcels WHERE status = ?', ['delivered']);
    const [revenue] = await pool.query('SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status = ?', ['completed']);
    res.json({
      users: users[0].c,
      drivers: drivers[0].c,
      completedRides: rides[0].c,
      deliveredParcels: parcels[0].c,
      totalRevenue: revenue[0].total
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const listRides = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT r.*, u.name as user_name FROM rides r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC LIMIT 100'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const listParcels = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT p.*, u.name as sender_name FROM parcels p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 100');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const sendInactivityReminders = async (req, res) => {
  try {
    // Select users who registered but never booked in 7 days, or whose last booking was > 7 days ago
    const query = `
      SELECT u.id, u.name, u.phone, u.created_at, MAX(r.created_at) as last_ride_date 
      FROM users u 
      LEFT JOIN rides r ON u.id = r.user_id 
      WHERE u.role = 'user'
      GROUP BY u.id 
      HAVING (last_ride_date IS NULL AND u.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY))
         OR (last_ride_date < DATE_SUB(NOW(), INTERVAL 7 DAY))
    `;
    const [inactiveUsers] = await pool.query(query);

    const sentTo = [];
    for (const user of inactiveUsers) {
      const message = `Hello, ${user.name}! Tripzy is missing you. Take a look at our Platform Services (Rides, Pools, Parcels) and book your next journey today! 🌿🚕`;
      
      // Dispatch via SMS Service
      await sendSMS(user.phone, message, '');
      sentTo.push({ id: user.id, name: user.name, phone: user.phone });
    }

    res.json({
      success: true,
      message: `SMS reminders sent to ${sentTo.length} inactive user(s).`,
      recipients: sentTo
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { getStats, listUsers, listRides, listParcels, sendInactivityReminders };
