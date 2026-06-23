const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tripzy_secret');
    const [rows] = await pool.query('SELECT id, name, email, phone, role FROM users WHERE id = ?', [decoded.userId]);
    if (!rows.length) {
      return res.status(401).json({ error: 'User not found.' });
    }
    req.user = rows[0];
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

const driverOnly = (req, res, next) => {
  if (req.user.role !== 'driver') {
    return res.status(403).json({ error: 'Driver access required.' });
  }
  next();
};

module.exports = { auth, adminOnly, driverOnly };
