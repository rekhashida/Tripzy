import React, { useState } from 'react';
import { FiCreditCard, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import Modal from './Modal';
import Button from './Button';
import Card from './Card';
import Badge from './Badge';
import { useAuth } from '../context/AuthContext';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PaymentModal({ isOpen, onClose, amount, rideId, parcelId, onSuccess }) {
  const { user, fetchProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');

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

  const handleGatewayPayment = async () => {
    setLoading(true);
    setMsg('Initializing gateway checkout...');
    setMsgType('info');
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script.');
      }

      const { data } = await api.post('/payments/create-order', {
        amount: amount,
        ride_id: rideId,
        parcel_id: parcelId
      });

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'Tripzy Payment',
        description: rideId ? `Payment for Ride #${rideId}` : `Payment for Parcel #${parcelId}`,
        order_id: data.orderId,
        handler: async function (response) {
          setLoading(true);
          setMsg('Verifying transaction signature...');
          setMsgType('info');
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id || data.orderId,
              razorpay_payment_id: response.razorpay_payment_id || `pay_mock_${Date.now()}`,
              razorpay_signature: response.razorpay_signature || ''
            });
            setMsg('Transaction completed successfully! 🎉');
            setMsgType('success');
            await fetchProfile();
            setTimeout(() => {
              onSuccess?.();
              onClose();
            }, 1500);
          } catch (verifyErr) {
            setMsg(verifyErr.response?.data?.error || 'Payment verification failed.');
            setMsgType('error');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || ''
        },
        theme: {
          color: '#0f4c9c'
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setMsg('Payment cancelled.');
            setMsgType('info');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      setMsg(e.response?.data?.error || e.message || 'Payment failed.');
      setMsgType('error');
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
          onClick={handleGatewayPayment}
          disabled={loading || walletLoading}
          className="w-full"
        >
          <FiCreditCard /> {loading ? 'Opening Checkout...' : 'Pay with Card / UPI'}
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <Button variant="outline" onClick={onClose} disabled={loading || walletLoading}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
