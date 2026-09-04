const pool = require('../config/db');
const { sendSMS } = require('../services/smsService');
const fs = require('fs');
const path = require('path');

const getEmergencyContacts = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY id DESC', [req.user.id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const addEmergencyContact = async (req, res) => {
  try {
    const { name, phone, relation } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required.' });

    const [existing] = await pool.query('SELECT COUNT(*) as c FROM emergency_contacts WHERE user_id = ?', [req.user.id]);
    if (existing[0].c >= 3) {
      return res.status(400).json({ error: 'Maximum 3 emergency contacts allowed.' });
    }

    await pool.query(
      'INSERT INTO emergency_contacts (user_id, name, phone, relation) VALUES (?, ?, ?, ?)',
      [req.user.id, name, phone, relation || 'Emergency Contact']
    );
    res.status(201).json({ message: 'Emergency contact added.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const deleteEmergencyContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    await pool.query('DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?', [contactId, req.user.id]);
    res.json({ message: 'Emergency contact removed.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const triggerSOS = async (req, res) => {
  try {
    const { ride_id, lat, lng } = req.body;
    const userId = req.user.id;

    // 1. Insert alert record
    const [result] = await pool.query(
      'INSERT INTO sos_alerts (user_id, ride_id, lat, lng, status) VALUES (?, ?, ?, ?, ?)',
      [userId, ride_id || null, lat || 23.0225, lng || 72.5714, 'active']
    );
    const alertId = result.insertId;

    // 2. Fetch emergency contacts
    const [contacts] = await pool.query('SELECT * FROM emergency_contacts WHERE user_id = ?', [userId]);

    const trackingUrl = ride_id ? `http://localhost:3000/tracking/${ride_id}` : `http://localhost:3000`;
    const message = `🚨 EMERGENCY ALERT! ${req.user.name} triggered SOS on Tripzy! Live location: https://maps.google.com/?q=${lat},${lng}. Tracking: ${trackingUrl}`;

    for (const c of contacts) {
      await sendSMS(c.phone, message, '');
    }

    res.json({
      alertId,
      message: `SOS Triggered! SMS alerts dispatched to ${contacts.length} emergency contact(s). Admin notified.`,
      contactsNotified: contacts.length
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const uploadAudioStream = async (req, res) => {
  try {
    const { alert_id, audio_base64 } = req.body;
    if (!alert_id || !audio_base64) return res.status(400).json({ error: 'Alert ID and audio data required.' });

    const uploadDir = path.join(__dirname, '../uploads/sos_audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `sos_${alert_id}_${Date.now()}.webm`;
    const filePath = path.join(uploadDir, filename);
    const base64Data = audio_base64.replace(/^data:audio\/\w+;base64,/, '');

    fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });
    const audioUrl = `http://localhost:5000/uploads/sos_audio/${filename}`;

    await pool.query('UPDATE sos_alerts SET audio_url = ? WHERE id = ?', [audioUrl, alert_id]);

    res.json({ message: 'Audio stream saved.', audioUrl });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getSosAlerts = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, u.name as user_name, u.phone as user_phone, u.email as user_email 
       FROM sos_alerts s 
       JOIN users u ON s.user_id = u.id 
       ORDER BY s.created_at DESC LIMIT 50`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const resolveSosAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    await pool.query('UPDATE sos_alerts SET status = ? WHERE id = ?', ['resolved', alertId]);
    res.json({ message: 'SOS alert resolved.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  getEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact,
  triggerSOS,
  uploadAudioStream,
  getSosAlerts,
  resolveSosAlert
};
