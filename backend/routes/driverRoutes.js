const express = require('express');
const { auth, driverOnly } = require('../middleware/auth');
const {
  getDashboard,
  getMatchingRides,
  updateAvailability,
  acceptRide,
  updateRideStatus,
  submitKYC,
  getSettlements
} = require('../controllers/driverController');

const router = express.Router();

router.use(auth);
router.use(driverOnly);

router.get('/dashboard', getDashboard);
router.get('/requests', getMatchingRides);
router.put('/availability', updateAvailability);
router.post('/rides/:rideId/accept', acceptRide);
router.post('/rides/:rideId/status', updateRideStatus);
router.post('/kyc', submitKYC);
router.get('/settlements', getSettlements);

module.exports = router;
