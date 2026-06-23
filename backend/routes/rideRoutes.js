const express = require('express');
const { auth } = require('../middleware/auth');
const {
  estimateFare,
  createRide,
  assignDriver,
  verifyPickupOTP,
  verifyDropOTP,
  myRides,
  getRide,
  cancelRide
} = require('../controllers/ridesController');
const router = express.Router();

router.post('/estimate', estimateFare);
router.post('/', auth, createRide);
router.get('/my', auth, myRides);
router.get('/:rideId', auth, getRide);
router.post('/:rideId/cancel', auth, cancelRide);
router.put('/:rideId/assign', auth, assignDriver);
router.post('/:rideId/verify-pickup', auth, verifyPickupOTP);
router.post('/:rideId/verify-drop', auth, verifyDropOTP);

module.exports = router;
