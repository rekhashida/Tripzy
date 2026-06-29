const express = require('express');
const { auth, adminOnly } = require('../middleware/auth');
const { getStats, listUsers, listRides, listParcels, sendInactivityReminders } = require('../controllers/adminController');
const router = express.Router();

router.use(auth);
router.use(adminOnly);
router.get('/stats', getStats);
router.get('/users', listUsers);
router.get('/rides', listRides);
router.get('/parcels', listParcels);
router.post('/send-inactivity-reminders', sendInactivityReminders);

module.exports = router;
