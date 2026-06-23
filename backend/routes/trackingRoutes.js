const express = require('express');
const { auth, driverOnly } = require('../middleware/auth');
const { getRideForTracking, updateDriverLocation } = require('../controllers/trackingController');
const router = express.Router();

router.get('/ride/:rideId', auth, getRideForTracking);
router.post('/driver-location', auth, driverOnly, updateDriverLocation);

module.exports = router;
