// backend/routes/rides.js
const router = require('express').Router();
const auth = require('../middleware/authenticate');
const rideController = require('../controllers/rideController');

router.post('/calculate-fare', auth, rideController.calculateFare);
router.post('/request', auth, rideController.requestRide);
router.post('/:ride_id/generate-otp', auth, rideController.generatePickupOtp);
router.post('/:ride_id/verify-otp', auth, rideController.verifyOtp);

module.exports = router;
