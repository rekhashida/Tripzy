const pool = require('../config/db');

const getCommutePasses = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM commute_passes WHERE user_id = ? AND expires_at >= CURDATE() AND trips_remaining > 0 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const buyCommutePass = async (req, res) => {
  try {
    const { pickup_address, drop_address, pass_type } = req.body;
    const userId = req.user.id;

    if (!pickup_address || !drop_address || !pass_type) {
      return res.status(400).json({ error: 'Pickup, drop address and pass type required.' });
    }

    let totalTrips = 10;
    let farePerTrip = 45.00;
    let days = 7;

    if (pass_type === 'weekly') {
      totalTrips = 10; farePerTrip = 45.00; days = 7;
    } else if (pass_type === 'monthly') {
      totalTrips = 40; farePerTrip = 38.00; days = 30;
    } else if (pass_type === 'student') {
      totalTrips = 20; farePerTrip = 19.95; days = 30; // ₹399 total
    } else if (pass_type === 'family') {
      totalTrips = 50; farePerTrip = 25.98; days = 30; // ₹1299 total
    }

    const totalCost = Math.round(totalTrips * farePerTrip);

    // Check user balance
    const [user] = await pool.query('SELECT wallet_balance FROM users WHERE id = ?', [userId]);
    const balance = parseFloat(user[0]?.wallet_balance || 0);

    if (balance < totalCost) {
      return res.status(400).json({ error: `Insufficient wallet balance (Requires ₹${totalCost}). Please top up.` });
    }

    // Deduct balance
    await pool.query('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?', [totalCost, userId]);

    // Expiry Date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const [result] = await pool.query(
      `INSERT INTO commute_passes (user_id, pickup_address, drop_address, pass_type, total_trips, trips_remaining, fare_per_trip, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, pickup_address, drop_address, pass_type, totalTrips, totalTrips, farePerTrip, expiryDate.toISOString().slice(0, 10)]
    );

    res.status(201).json({
      passId: result.insertId,
      message: `🎉 ${pass_type.toUpperCase()} Commute Pass activated! Total ${totalTrips} trips @ ₹${farePerTrip}/trip.`
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getCorporateAccount = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM corporate_accounts WHERE user_id = ?', [req.user.id]);
    res.json(rows[0] || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const saveCorporateAccount = async (req, res) => {
  try {
    const { company_name, gst_number, company_email, billing_address } = req.body;
    const userId = req.user.id;

    if (!company_name || !gst_number) {
      return res.status(400).json({ error: 'Company name and GST number are required.' });
    }

    const [existing] = await pool.query('SELECT id FROM corporate_accounts WHERE user_id = ?', [userId]);

    if (existing.length > 0) {
      await pool.query(
        `UPDATE corporate_accounts 
         SET company_name = ?, gst_number = ?, company_email = ?, billing_address = ? 
         WHERE user_id = ?`,
        [company_name, gst_number, company_email || req.user.email, billing_address || 'India', userId]
      );
    } else {
      await pool.query(
        `INSERT INTO corporate_accounts (user_id, company_name, gst_number, company_email, billing_address)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, company_name, gst_number, company_email || req.user.email, billing_address || 'India']
      );
    }

    await pool.query('UPDATE users SET is_corporate = 1 WHERE id = ?', [userId]);

    res.json({ message: 'Corporate business profile saved.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { getCommutePasses, buyCommutePass, getCorporateAccount, saveCorporateAccount };
