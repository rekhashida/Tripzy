// backend/services/paymentService.js
const Razorpay = require('razorpay');
const db = require('../config/db');
const crypto = require('crypto');
const { v4: uuid } = require('uuid');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const PaymentService = {
  async createOrder(user_id, ride_id, amount) {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `ride_${ride_id}`,
      notes: { ride_id, user_id }
    });

    const payment_id = uuid();
    await db.execute(
      'INSERT INTO payments (payment_id, ride_id, user_id, amount, status) VALUES (?,?,?,?,?)',
      [payment_id, ride_id, user_id, amount, 'PENDING']
    );

    return { order_id: order.id, amount, currency: 'INR', payment_id };
  },

  async verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id) {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) throw new Error('Invalid signature');

    await db.execute('UPDATE payments SET status=? WHERE payment_id=?', ['PAID', payment_id]);
    return { success: true };
  }
};

module.exports = PaymentService;
