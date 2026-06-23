// backend/controllers/paymentController.js
const PaymentService = require('../services/paymentService');

exports.createOrder = async (req, res) => {
  try {
    const { ride_id, amount } = req.body;
    const user_id = req.user.user_id;
    const result = await PaymentService.createOrder(user_id, ride_id, amount);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Order creation failed' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id } = req.body;
    const result = await PaymentService.verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      payment_id
    );
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
