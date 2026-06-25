import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiNavigation, 
  FiPackage, 
  FiUsers, 
  FiMic, 
  FiMap, 
  FiTruck,
  FiShield,
  FiLogOut,
  FiUser,
  FiCreditCard
} from 'react-icons/fi';
import Modal from './Modal';
import Input from './Input';
import Button from './Button';
import api from '../services/api';

export default function Nav() {
  const { user, logout, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('500');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupMsg, setTopupMsg] = useState('');
  const [topupMsgType, setTopupMsgType] = useState('info');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTopup = async () => {
    const amt = parseFloat(topupAmount);
    if (isNaN(amt) || amt <= 0) {
      setTopupMsg('Please enter a valid amount.');
      setTopupMsgType('error');
      return;
    }
    setTopupLoading(true);
    setTopupMsg('');
    try {
      await api.post('/payments/topup', { amount: amt });
      setTopupMsg(`Successfully added ₹${amt} to your wallet!`);
      setTopupMsgType('success');
      await fetchProfile();
      setTimeout(() => {
        setShowTopupModal(false);
        setTopupMsg('');
      }, 1500);
    } catch (e) {
      setTopupMsg(e.response?.data?.error || 'Failed to top up wallet');
      setTopupMsgType('error');
    } finally {
      setTopupLoading(false);
    }
  };

  return (
    <>
      <nav className="nav">
        <div className="brand">
          <FiNavigation style={{ fontSize: '1.5rem' }} />
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Tripzy</NavLink>
        </div>
        
        {user && user.role === 'driver' && (
          <div className="nav-links">
            <NavLink to="/driver" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiTruck /> Dashboard
            </NavLink>
            <NavLink to="/my-rides" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiMap /> Job History
            </NavLink>
            <NavLink to="/my-parcels" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiPackage /> Deliveries
            </NavLink>
          </div>
        )}

        {user && user.role !== 'driver' && (
          <div className="nav-links">
            <NavLink to="/ride" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiNavigation /> Ride
            </NavLink>
            <NavLink to="/parcel" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiPackage /> Parcel
            </NavLink>
            <NavLink to="/pooling" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiUsers /> Pooling
            </NavLink>
            <NavLink to="/voice" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiMic /> Voice
            </NavLink>
          </div>
        )}
        
        <div className="spacer" />
        
        <div className="nav-links" style={{ alignItems: 'center' }}>
          {user ? (
            <>
              {user.role !== 'driver' && (
                <div 
                  className="wallet-indicator" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    background: 'rgba(99, 102, 241, 0.15)', 
                    padding: '0.4rem 0.8rem', 
                    borderRadius: '20px', 
                    border: '1px solid var(--primary)', 
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#818cf8',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out'
                  }} 
                  onClick={() => setShowTopupModal(true)}
                  title="Click to top up wallet"
                >
                  <FiCreditCard style={{ fontSize: '1rem' }} /> 
                  ₹{user.wallet_balance !== undefined ? parseFloat(user.wallet_balance).toFixed(2) : '0.00'}
                </div>
              )}
              
              {user.role !== 'driver' && (
                <>
                  <NavLink to="/my-rides" className={({ isActive }) => isActive ? 'active' : ''}>
                    <FiMap /> My Rides
                  </NavLink>
                  <NavLink to="/my-parcels" className={({ isActive }) => isActive ? 'active' : ''}>
                    <FiTruck /> My Parcels
                  </NavLink>
                </>
              )}
              {user.role === 'admin' && (
                <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                  <FiShield /> Admin
                </NavLink>
              )}
              <div className="username">
                <FiUser /> {user.name}
              </div>
              <button className="btn btn-outline" onClick={handleLogout}>
                <FiLogOut /> Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>Login</NavLink>
              <NavLink to="/register" className={({ isActive }) => (isActive ? 'active ' : '') + 'btn btn-primary'}>Register</NavLink>
            </>
          )}
        </div>
      </nav>

      <Modal
        isOpen={showTopupModal}
        onClose={() => {
          setShowTopupModal(false);
          setTopupMsg('');
        }}
        title="Top Up Tripzy Wallet"
      >
        <div style={{ padding: '1rem 0' }}>
          {topupMsg && (
            <div className={`alert alert-${topupMsgType === 'success' ? 'success' : topupMsgType === 'error' ? 'error' : 'info'}`} style={{ marginBottom: '1rem' }}>
              {topupMsg}
            </div>
          )}
          
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Enter the amount you would like to load into your simulated digital wallet.
          </p>

          <Input
            type="number"
            label="Amount (₹)"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            placeholder="Enter amount to load"
            min="10"
            max="10000"
            style={{ marginBottom: '1.5rem' }}
          />

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Button
              variant="primary"
              onClick={handleTopup}
              disabled={topupLoading}
              className="flex-1"
            >
              {topupLoading ? 'Adding Funds...' : 'Load Funds'}
            </Button>
            <Button variant="outline" onClick={() => setShowTopupModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
