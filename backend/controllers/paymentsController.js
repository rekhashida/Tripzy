const Razorpay = require('razorpay');
const pool = require('../config/db');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

const createOrder = async (req, res) => {
  try {
    const { amount, ride_id, parcel_id } = req.body;
    const userId = req.user.id;
    const amtPaise = Math.round(parseFloat(amount) * 100);
    if (amtPaise < 100) return res.status(400).json({ error: 'Minimum amount ₹1.' });
    const options = { amount: amtPaise, currency: 'INR', receipt: `tripzy_${Date.now()}` };
    const order = await razorpay.orders.create(options);
    await pool.query(
      'INSERT INTO payments (user_id, ride_id, parcel_id, razorpay_order_id, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, ride_id || null, parcel_id || null, order.id, amount, 'pending']
    );
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, key: process.env.RAZORPAY_KEY_ID });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Payment init failed.' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid signature.' });
    }
    await pool.query(
      'UPDATE payments SET razorpay_payment_id = ?, status = ? WHERE razorpay_order_id = ?',
      [razorpay_payment_id, 'completed', razorpay_order_id]
    );
    res.json({ message: 'Payment verified.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const myPayments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const payWithWallet = async (req, res) => {
  try {
    const { amount, ride_id, parcel_id } = req.body;
    const userId = req.user.id;

    // 1. Fetch user wallet balance
    const [users] = await pool.query('SELECT wallet_balance FROM users WHERE id = ?', [userId]);
    if (!users.length) return res.status(404).json({ error: 'User not found' });
    
    const balance = parseFloat(users[0].wallet_balance);
    const cost = parseFloat(amount);

    if (balance < cost) {
      return res.status(400).json({ error: 'Insufficient wallet balance. Please top up.' });
    }

    // 2. Deduct balance from user
    await pool.query('UPDATE users SET wallet_balance = wallet_balance - ? WHERE id = ?', [cost, userId]);

    // 3. Insert transaction record
    const mockOrderReceipt = `wallet_${Date.now()}`;
    await pool.query(
      'INSERT INTO payments (user_id, ride_id, parcel_id, razorpay_order_id, razorpay_payment_id, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, ride_id || null, parcel_id || null, mockOrderReceipt, `wallet_txn_${Date.now()}`, cost, 'completed']
    );

    res.json({ message: 'Payment completed successfully using wallet.', newBalance: balance - cost });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const topupWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return res.status(400).json({ error: 'Invalid top-up amount.' });

    await pool.query('UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?', [amt, userId]);
    const [users] = await pool.query('SELECT wallet_balance FROM users WHERE id = ?', [userId]);
    
    res.json({ message: 'Wallet topped up successfully.', newBalance: users[0].wallet_balance });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { createOrder, verifyPayment, myPayments, payWithWallet, topupWallet };
