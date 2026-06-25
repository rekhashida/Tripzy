import React, { useState } from 'react';
import { FiCreditCard, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import Card from './Card';
import Badge from './Badge';
import { useAuth } from '../context/AuthContext';

export default function PaymentModal({ isOpen, onClose, amount, rideId, parcelId, onSuccess }) {
  const { user, fetchProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
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

  const handleWalletPayment = async () => {
    setWalletLoading(true);
    setMsg('');
    try {
      await api.post('/payments/pay-wallet', {
        amount: amount,
        ride_id: rideId,
        parcel_id: parcelId
      });
      setMsg('Payment completed successfully using wallet!');
      setMsgType('success');
      await fetchProfile(); // Refresh balance
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (e) {
      setMsg(e.response?.data?.error || 'Wallet payment failed');
      setMsgType('error');
    } finally {
      setWalletLoading(false);
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
    } catch (e) {
      setMsg(e.response?.data?.error || 'Failed to create order');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const hasSufficientBalance = user && user.wallet_balance !== undefined && parseFloat(user.wallet_balance) >= parseFloat(amount);

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

      {user && (
        <Card style={{ 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(129, 140, 248, 0.1))', 
          border: '1px solid var(--primary)',
          marginBottom: '1.5rem',
          padding: '1rem' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--text)' }}>Tripzy Wallet</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Balance: ₹{user.wallet_balance !== undefined ? parseFloat(user.wallet_balance).toFixed(2) : '0.00'}
              </div>
            </div>
            {hasSufficientBalance ? (
              <Badge variant="success">Sufficient Balance</Badge>
            ) : (
              <Badge variant="danger">Low Balance</Badge>
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleWalletPayment}
            disabled={loading || walletLoading || !hasSufficientBalance}
            className="w-full"
          >
            {walletLoading ? 'Processing Wallet Payment...' : 'Pay with Wallet'}
          </Button>
        </Card>
      )}

      <div style={{ textAlign: 'center', margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500' }}>
        — OR PAY VIA GATEWAY —
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <Button
          variant="primary"
          onClick={createOrder}
          disabled={loading || walletLoading}
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
          disabled={walletLoading}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <Button
          variant="primary"
          onClick={handlePayment}
          disabled={loading || walletLoading || !paymentId}
          className="flex-1"
        >
          {loading ? 'Verifying...' : (
            <>
              <FiCheckCircle /> Verify Payment
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onClose} disabled={walletLoading}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
