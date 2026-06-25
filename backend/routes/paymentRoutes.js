const express = require('express');
const { auth } = require('../middleware/auth');
const { createOrder, verifyPayment, myPayments, payWithWallet, topupWallet } = require('../controllers/paymentsController');
const router = express.Router();

router.post('/create-order', auth, createOrder);
router.post('/verify', auth, verifyPayment);
router.post('/pay-wallet', auth, payWithWallet);
router.post('/topup', auth, topupWallet);
router.get('/my', auth, myPayments);

module.exports = router;
