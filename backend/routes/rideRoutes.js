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
  cancelRide,
  getRideChats,
  submitBid,
  getBidsForRide,
  acceptBid
} = require('../controllers/ridesController');
const router = express.Router();

router.post('/estimate', estimateFare);
router.post('/', auth, createRide);
router.get('/my', auth, myRides);
router.get('/:rideId', auth, getRide);
router.get('/:rideId/chats', auth, getRideChats);
router.post('/:rideId/cancel', auth, cancelRide);
router.put('/:rideId/assign', auth, assignDriver);
router.post('/:rideId/verify-pickup', auth, verifyPickupOTP);
router.post('/:rideId/verify-drop', auth, verifyDropOTP);
router.post('/:rideId/bids', auth, submitBid);
router.get('/:rideId/bids', auth, getBidsForRide);
router.post('/:rideId/accept-bid', auth, acceptBid);

module.exports = router;
