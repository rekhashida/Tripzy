const pool = require('../config/db');
const { getDistanceAndDuration } = require('../services/mapsService');
const { calculateParcelFare } = require('../services/fareService');
const { findNearbyDrivers } = require('../services/matchingService');
const { saveOTP, verifyOTP } = require('../services/otpService');

const createParcel = async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, drop_lat, drop_lng, pickup_address, drop_address, recipient_name, recipient_phone, weight_kg } = req.body;
    const userId = req.user.id;
    const { distanceKm } = await getDistanceAndDuration(pickup_lat, pickup_lng, drop_lat, drop_lng);
    const fare = calculateParcelFare(distanceKm, weight_kg || 1);
    const [result] = await pool.query(
      `INSERT INTO parcels (user_id, pickup_lat, pickup_lng, drop_lat, drop_lng, pickup_address, drop_address, recipient_name, recipient_phone, weight_kg, fare, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, pickup_lat, pickup_lng, drop_lat, drop_lng, pickup_address || null, drop_address || null, recipient_name || null, recipient_phone || null, weight_kg || 1, fare]
    );
    const parcelId = result.insertId;
    const pickupOtp = await saveOTP(recipient_phone || req.user.phone, 'parcel_pickup', parcelId);
    const dropOtp = await saveOTP(recipient_phone || req.user.phone, 'parcel_drop', parcelId);
    await pool.query('UPDATE parcels SET pickup_otp = ?, drop_otp = ? WHERE id = ?', [pickupOtp, dropOtp, parcelId]);
    res.status(201).json({ parcelId, fare, pickup_otp: pickupOtp, drop_otp: dropOtp, message: 'Parcel created.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const myParcels = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.* FROM parcels p WHERE p.user_id = ? ORDER BY p.created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getParcel = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM parcels WHERE id = ? AND user_id = ?', [req.params.parcelId, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Parcel not found.' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const verifyParcelPickupOTP = async (req, res) => {
  try {
    const { parcelId } = req.params;
    const { otp } = req.body;
    const [p] = await pool.query('SELECT * FROM parcels WHERE id = ?', [parcelId]);
    if (!p.length) return res.status(404).json({ error: 'Parcel not found.' });
    const phone = p[0].recipient_phone || (await pool.query('SELECT phone FROM users WHERE id = ?', [p[0].user_id]))[0][0]?.phone;
    const valid = await verifyOTP(phone, otp, 'parcel_pickup', parseInt(parcelId));
    if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP.' });
    await pool.query('UPDATE parcels SET status = ? WHERE id = ?', ['picked_up', parcelId]);
    res.json({ message: 'Parcel picked up.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const verifyParcelDropOTP = async (req, res) => {
  try {
    const { parcelId } = req.params;
    const { otp } = req.body;
    const [p] = await pool.query('SELECT * FROM parcels WHERE id = ?', [parcelId]);
    if (!p.length) return res.status(404).json({ error: 'Parcel not found.' });
    const phone = p[0].recipient_phone || (await pool.query('SELECT phone FROM users WHERE id = ?', [p[0].user_id]))[0][0]?.phone;
    const valid = await verifyOTP(phone, otp, 'parcel_drop', parseInt(parcelId));
    if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP.' });
    await pool.query('UPDATE parcels SET status = ?, delivered_at = NOW() WHERE id = ?', ['delivered', parcelId]);
    res.json({ message: 'Parcel delivered.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { createParcel, myParcels, getParcel, verifyParcelPickupOTP, verifyParcelDropOTP };
