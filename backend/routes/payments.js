// backend/routes/payments.js
const router = require('express').Router();
const auth = require('../middleware/authenticate');
const paymentController = require('../controllers/paymentController');

router.post('/create-order', auth, paymentController.createOrder);
router.post('/verify', auth, paymentController.verifyPayment);

module.exports = router;
