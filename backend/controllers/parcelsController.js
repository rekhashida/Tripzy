const pool = require('../config/db');
const { getDistanceAndDuration, optimizeTSPRoute } = require('../services/mapsService');
const { calculateParcelFare, isPeakHour, isLateNight } = require('../services/fareService');
const { saveOTP, verifyOTP } = require('../services/otpService');

const createParcel = async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, drop_lat, drop_lng, pickup_address, drop_address, recipient_name, recipient_phone, weight_kg, stops, optimize_tsp } = req.body;
    const userId = req.user.id;
    
    let processedStops = stops || [];
    if (optimize_tsp && processedStops.length > 1) {
      processedStops = optimizeTSPRoute({ lat: pickup_lat, lng: pickup_lng }, processedStops);
    }

    // Determine final drop coords
    const finalDropLat = processedStops.length > 0 ? processedStops[processedStops.length - 1].lat : drop_lat;
    const finalDropLng = processedStops.length > 0 ? processedStops[processedStops.length - 1].lng : drop_lng;
    const finalDropAddr = processedStops.length > 0 ? processedStops[processedStops.length - 1].address : drop_address;

    const { distanceKm } = await getDistanceAndDuration(pickup_lat, pickup_lng, finalDropLat, finalDropLng);
    // Add 15% extra fare per additional stop
    const extraStopMultiplier = 1 + (processedStops.length > 1 ? (processedStops.length - 1) * 0.15 : 0);
    const fare = Math.round(calculateParcelFare(distanceKm, weight_kg || 1) * extraStopMultiplier);

    const [result] = await pool.query(
      `INSERT INTO parcels (user_id, pickup_lat, pickup_lng, drop_lat, drop_lng, pickup_address, drop_address, recipient_name, recipient_phone, weight_kg, fare, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, pickup_lat, pickup_lng, finalDropLat, finalDropLng, pickup_address || null, finalDropAddr || null, recipient_name || null, recipient_phone || null, weight_kg || 1, fare]
    );
    const parcelId = result.insertId;

    // Insert stops into parcel_stops
    if (processedStops.length > 0) {
      for (let i = 0; i < processedStops.length; i++) {
        const s = processedStops[i];
        await pool.query(
          `INSERT INTO parcel_stops (parcel_id, stop_order, address, lat, lng, recipient_name, recipient_phone)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [parcelId, i + 1, s.address, s.lat, s.lng, s.recipient_name || 'Recipient', s.recipient_phone || recipient_phone || req.user.phone]
        );
      }
    }

    const pickupOtp = await saveOTP(recipient_phone || req.user.phone, 'parcel_pickup', parcelId);
    const dropOtp = await saveOTP(recipient_phone || req.user.phone, 'parcel_drop', parcelId);
    await pool.query('UPDATE parcels SET pickup_otp = ?, drop_otp = ? WHERE id = ?', [pickupOtp, dropOtp, parcelId]);

    res.status(201).json({ parcelId, fare, pickup_otp: pickupOtp, drop_otp: dropOtp, stops: processedStops, message: 'Parcel created.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const estimateParcel = async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, drop_lat, drop_lng, weight_kg, stops, optimize_tsp } = req.body;
    let processedStops = stops || [];
    if (optimize_tsp && processedStops.length > 1) {
      processedStops = optimizeTSPRoute({ lat: pickup_lat, lng: pickup_lng }, processedStops);
    }
    const finalDropLat = processedStops.length > 0 ? processedStops[processedStops.length - 1].lat : drop_lat;
    const finalDropLng = processedStops.length > 0 ? processedStops[processedStops.length - 1].lng : drop_lng;

    const { distanceKm, durationMin } = await getDistanceAndDuration(pickup_lat, pickup_lng, finalDropLat, finalDropLng);
    const extraStopMultiplier = 1 + (processedStops.length > 1 ? (processedStops.length - 1) * 0.15 : 0);
    const fare = calculateParcelFare(distanceKm, weight_kg || 1) * extraStopMultiplier;
    const surge = isPeakHour() ? 1.4 : isLateNight() ? 1.2 : 1.0;
    const finalFare = Math.round(fare * surge);

    res.json({
      fare: finalFare,
      distanceKm,
      durationMin,
      stops: processedStops,
      breakdown: {
        base: fare,
        surge,
        final: finalFare,
        isPeakHour: isPeakHour(),
        isLateNight: isLateNight()
      }
    });
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
    const parcel = rows[0];

    const [stops] = await pool.query('SELECT * FROM parcel_stops WHERE parcel_id = ? ORDER BY stop_order ASC', [parcel.id]);
    parcel.stops = stops || [];

    res.json(parcel);
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
    let valid = await verifyOTP(phone, otp, 'parcel_pickup', parseInt(parcelId));
    if (!valid && p[0].pickup_otp === otp) {
      valid = true;
    }
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
    let valid = await verifyOTP(phone, otp, 'parcel_drop', parseInt(parcelId));
    if (!valid && p[0].drop_otp === otp) {
      valid = true;
    }
    if (!valid) return res.status(400).json({ error: 'Invalid or expired OTP.' });
    await pool.query('UPDATE parcels SET status = ?, delivered_at = NOW() WHERE id = ?', ['delivered', parcelId]);
    await pool.query('UPDATE parcel_stops SET status = ? WHERE parcel_id = ?', ['completed', parcelId]);
    res.json({ message: 'Parcel delivered.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { createParcel, estimateParcel, myParcels, getParcel, verifyParcelPickupOTP, verifyParcelDropOTP };
