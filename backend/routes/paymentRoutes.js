const express = require('express');
const { auth } = require('../middleware/auth');
const { createOrder, verifyPayment, myPayments } = require('../controllers/paymentsController');
const router = express.Router();

router.post('/create-order', auth, createOrder);
router.post('/verify', auth, verifyPayment);
router.get('/my', auth, myPayments);

module.exports = router;
