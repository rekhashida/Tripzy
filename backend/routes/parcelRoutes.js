const express = require('express');
const { auth } = require('../middleware/auth');
const {
  createParcel,
  estimateParcel,
  myParcels,
  getParcel,
  verifyParcelPickupOTP,
  verifyParcelDropOTP
} = require('../controllers/parcelsController');
const router = express.Router();

router.post('/', auth, createParcel);
router.post('/estimate', auth, estimateParcel);
router.get('/my', auth, myParcels);
router.get('/:parcelId', auth, getParcel);
router.post('/:parcelId/verify-pickup', auth, verifyParcelPickupOTP);
router.post('/:parcelId/verify-drop', auth, verifyParcelDropOTP);

module.exports = router;
