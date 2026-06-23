import React, { useState } from 'react';
import { FiCreditCard, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import Card from './Card';

export default function PaymentModal({ isOpen, onClose, amount, rideId, parcelId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');

  const handlePayment = async () => {
    if (!paymentId) {
      setMsg('Please enter payment ID from Razorpay');
      setMsgType('error');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      await api.post('/payments/verify', {
        razorpay_payment_id: paymentId,
        ride_id: rideId,
        parcel_id: parcelId
      });
      setMsg('Payment verified successfully!');
      setMsgType('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (e) {
      setMsg(e.response?.data?.error || 'Payment verification failed');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async () => {
    setLoading(true);
    setMsg('');
    try {
      const { data } = await api.post('/payments/create-order', {
        amount: amount,
        ride_id: rideId,
        parcel_id: parcelId
      });
      setMsg(`Order created! Order ID: ${data.orderId}. Please complete payment using Razorpay and enter the payment ID below.`);
      setMsgType('info');
      // In a real app, you would open Razorpay checkout here
      // window.RazorpayCheckout.open({...})
    } catch (e) {
      setMsg(e.response?.data?.error || 'Failed to create order');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Payment"
      className="payment-modal"
    >
      <Card style={{ background: 'var(--bg-tertiary)', marginBottom: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Amount to Pay</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-light)' }}>
            <FiDollarSign style={{ display: 'inline' }} /> ₹{amount}
          </div>
        </div>
      </Card>

      {msg && (
        <div className={`alert alert-${msgType === 'success' ? 'success' : msgType === 'error' ? 'error' : 'info'}`} style={{ marginBottom: '1.5rem' }}>
          {msg}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <Button
          variant="primary"
          onClick={createOrder}
          disabled={loading}
          className="w-full"
          style={{ marginBottom: '1rem' }}
        >
          <FiCreditCard /> Create Payment Order
        </Button>

        <Input
          type="text"
          label="Razorpay Payment ID"
          value={paymentId}
          onChange={(e) => setPaymentId(e.target.value)}
          placeholder="Enter payment ID from Razorpay"
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Button
          variant="primary"
          onClick={handlePayment}
          disabled={loading || !paymentId}
          className="flex-1"
        >
          {loading ? 'Verifying...' : (
            <>
              <FiCheckCircle /> Verify Payment
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
