const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const demoUsersMap = {
  1: { id: 1, name: 'Tripzy Admin', email: 'admin@tripzy.com', phone: '9999999999', role: 'admin', wallet_balance: 5000.00 },
  2: { id: 2, name: 'Rajesh Kumar', email: 'driver@tripzy.com', phone: '8888888888', role: 'driver', wallet_balance: 1000.00 },
  3: { id: 3, name: 'Somabhai Rickshawala', email: 'auto_driver@tripzy.com', phone: '7777777777', role: 'driver', wallet_balance: 1000.00 },
  4: { id: 4, name: 'Amit Sharma', email: 'rider@tripzy.com', phone: '9876543210', role: 'user', wallet_balance: 1250.00 },
  5: { id: 5, name: 'Priya Patel', email: 'priya@tripzy.com', phone: '9123456780', role: 'user', wallet_balance: 600.00 },
  6: { id: 6, name: 'Rahul Mehta', email: 'rahul@tripzy.com', phone: '9123456781', role: 'user', wallet_balance: 450.00 },
  7: { id: 7, name: 'Sneha Reddy', email: 'sneha@tripzy.com', phone: '9123456782', role: 'user', wallet_balance: 800.00 }
};

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tripzy_secret');
    try {
      const [rows] = await pool.query('SELECT id, name, email, phone, role FROM users WHERE id = ?', [decoded.userId]);
      if (!rows.length) {
        if (demoUsersMap[decoded.userId]) {
          req.user = demoUsersMap[decoded.userId];
          return next();
        }
        return res.status(401).json({ error: 'User not found.' });
      }
      req.user = rows[0];
      next();
    } catch (dbErr) {
      if (demoUsersMap[decoded.userId]) {
        req.user = demoUsersMap[decoded.userId];
        return next();
      }
      return res.status(500).json({ error: 'Database connection offline.' });
    }
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
