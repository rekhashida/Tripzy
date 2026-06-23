const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const register = async (req, res) => {
  try {
    const { name, email, password, phone, role = 'user' } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: 'Name, email, password and phone are required.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashed, phone, role]
    );
    if (role === 'driver') {
      const { license_number, vehicle_type, vehicle_number } = req.body;
      await pool.query(
        'INSERT INTO drivers (user_id, license_number, vehicle_type, vehicle_number) VALUES (?, ?, ?, ?)',
        [result.insertId, license_number || null, vehicle_type || 'sedan', vehicle_number || null]
      );
    }
    const token = jwt.sign(
      { userId: result.insertId },
      process.env.JWT_SECRET || 'tripzy_secret',
      { expiresIn: '7d' }
    );
    res.status(201).json({ message: 'Registered successfully.', token, userId: result.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Email or phone already registered.' });
    }
    res.status(500).json({ error: e.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required.' });
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'tripzy_secret',
      { expiresIn: '7d' }
    );
    delete user.password;
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { register, login };
