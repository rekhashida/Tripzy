const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const {
  getEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact,
  triggerSOS,
  uploadAudioStream,
  getSosAlerts,
  resolveSosAlert
} = require('../controllers/sosController');

const router = express.Router();

router.use(auth);

router.get('/contacts', getEmergencyContacts);
router.post('/contacts', addEmergencyContact);
router.delete('/contacts/:contactId', deleteEmergencyContact);
router.post('/trigger', triggerSOS);
router.post('/audio-stream', uploadAudioStream);
router.get('/admin/alerts', adminOnly, getSosAlerts);
router.post('/admin/alerts/:alertId/resolve', adminOnly, resolveSosAlert);

module.exports = router;
