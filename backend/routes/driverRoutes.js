const express = require('express');
const { auth, driverOnly } = require('../middleware/auth');
const {
  getDashboard,
  getMatchingRides,
  updateAvailability,
  acceptRide,
  updateRideStatus
} = require('../controllers/driverController');

const router = express.Router();

router.use(auth);
router.use(driverOnly);

router.get('/dashboard', getDashboard);
router.get('/requests', getMatchingRides);
router.put('/availability', updateAvailability);
router.post('/rides/:rideId/accept', acceptRide);
router.post('/rides/:rideId/status', updateRideStatus);

module.exports = router;
