const pool = require('../config/db');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function saveOTP(phoneOrEmail, purpose, referenceId, ttlMinutes = 10) {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  await pool.query(
    'INSERT INTO otp_store (phone_or_email, otp, purpose, reference_id, expires_at) VALUES (?, ?, ?, ?, ?)',
    [phoneOrEmail, otp, purpose, referenceId || null, expiresAt]
  );
  return otp;
}

async function verifyOTP(phoneOrEmail, otp, purpose, referenceId = null) {
  const [rows] = await pool.query(
    'SELECT id FROM otp_store WHERE phone_or_email = ? AND otp = ? AND purpose = ? AND expires_at > NOW() AND (reference_id IS NULL OR reference_id = ?) LIMIT 1',
    [phoneOrEmail, otp, purpose, referenceId]
  );
  if (rows.length) {
    await pool.query('DELETE FROM otp_store WHERE id = ?', [rows[0].id]);
    return true;
  }
  return false;
}

module.exports = { generateOTP, saveOTP, verifyOTP };
