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
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, wallet_balance: user.wallet_balance } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, role, wallet_balance FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and Name are required.' });
    }

    // Check if user exists
    let [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (rows.length > 0) {
      user = rows[0];
    } else {
      // Auto-register new user (generate a safe, unique mock phone under 20 chars)
      const mockPhone = 'G_' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 10);
      const mockPassword = 'google_pass_' + Math.random().toString(36).slice(-8);
      const [insertResult] = await pool.query(
        'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
        [name, email, mockPassword, mockPhone, 'user']
      );
      const [newRows] = await pool.query('SELECT * FROM users WHERE id = ?', [insertResult.insertId]);
      user = newRows[0];
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'tripzy_secret',
      { expiresIn: '7d' }
    );
    delete user.password;
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, wallet_balance: user.wallet_balance } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const sendMobileOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    // Check if user exists with this phone number
    const [rows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!rows.length) {
      return res.status(400).json({ error: 'This phone number is not registered. Please register first.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Clear old login OTPs for this phone
    await pool.query('DELETE FROM otp_store WHERE phone_or_email = ? AND purpose = ?', [phone, 'login']);

    // Save to otp_store
    await pool.query(
      'INSERT INTO otp_store (phone_or_email, otp, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [phone, otp, 'login', expiresAt]
    );

    res.json({ message: 'OTP sent successfully.', otp }); // Return OTP in response for demo purposes
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const verifyMobileOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required.' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM otp_store WHERE phone_or_email = ? AND otp = ? AND purpose = ? AND expires_at > NOW()',
      [phone, otp, 'login']
    );

    if (!rows.length) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new one.' });
    }

    // Clear OTP after successful use
    await pool.query('DELETE FROM otp_store WHERE id = ?', [rows[0].id]);

    // Fetch user details
    const [userRows] = await pool.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (!userRows.length) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const user = userRows[0];
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'tripzy_secret',
      { expiresIn: '7d' }
    );
    delete user.password;
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, wallet_balance: user.wallet_balance } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { register, login, getProfile, googleLogin, sendMobileOtp, verifyMobileOtp };
