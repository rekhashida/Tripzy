import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
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

const WingedTaxiLogo = () => (
  <svg width="34" height="28" viewBox="0 0 34 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.6rem' }}>
    {/* Wings */}
    <path d="M4 14C8 9 14 7 20 8M2 18C7 14 13 13 18 14" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
    {/* Taxi Body */}
    <path d="M12 15C12 12.5 13.5 12 15 12H23C24.5 12 26 12.5 26 15L28 17.5C29 18.5 29 19.5 29 20H11L12 15Z" fill="var(--primary)" />
    {/* Taxi Wheels */}
    <circle cx="15.5" cy="21.5" r="2.5" fill="var(--text-primary)" stroke="var(--primary)" strokeWidth="1.5" />
    <circle cx="24.5" cy="21.5" r="2.5" fill="var(--text-primary)" stroke="var(--primary)" strokeWidth="1.5" />
    {/* Cabin Windows */}
    <path d="M16 14.5L19 14.5L19 12.5L17.5 12.5L16 14.5Z" fill="var(--bg-secondary)" />
    <path d="M20.5 14.5L23.5 14.5L22 12.5L20.5 12.5V14.5Z" fill="var(--bg-secondary)" />
  </svg>
);

export default function Nav() {
  const { user, logout, fetchProfile } = useAuth();
  const { lang, changeLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
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
          <WingedTaxiLogo />
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Tripzy</NavLink>
        </div>
        
        {user && user.role === 'driver' && (
          <div className="nav-links">
            <NavLink to="/driver" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiTruck /> {t('dashboard')}
            </NavLink>
            <NavLink to="/my-rides" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiMap /> {t('job_history')}
            </NavLink>
            <NavLink to="/my-parcels" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiPackage /> {t('deliveries')}
            </NavLink>
          </div>
        )}

        {user && user.role !== 'driver' && (
          <div className="nav-links">
            <NavLink to="/ride" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiNavigation /> {t('book_ride')}
            </NavLink>
            <NavLink to="/parcel" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiPackage /> {t('parcel_delivery')}
            </NavLink>
            <NavLink to="/pooling" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiUsers /> {t('ride_pooling')}
            </NavLink>
            <NavLink to="/voice" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiMic /> {t('voice_booking')}
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
                    background: 'var(--bg-glass)', 
                    padding: '0.4rem 0.8rem', 
                    borderRadius: '20px', 
                    border: '1px solid var(--primary)', 
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: 'var(--primary)',
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
                    <FiMap /> {t('my_rides')}
                  </NavLink>
                  <NavLink to="/my-parcels" className={({ isActive }) => isActive ? 'active' : ''}>
                    <FiTruck /> {t('my_parcels')}
                  </NavLink>
                </>
              )}
              {user.role === 'admin' && (
                <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                  <FiShield /> {t('admin')}
                </NavLink>
              )}
              <div className="username">
                <FiUser /> {user.name}
              </div>
              <button className="btn btn-outline" onClick={handleLogout}>
                <FiLogOut /> {t('logout')}
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>{t('login')}</NavLink>
              <NavLink to="/register" className={({ isActive }) => (isActive ? 'active ' : '') + 'btn btn-primary'}>{t('register')}</NavLink>
            </>
          )}

          {/* Language Selector Dropdown */}
          <select 
            value={lang} 
            onChange={(e) => changeLanguage(e.target.value)}
            style={{
              background: 'var(--bg-tertiary, #1f1f2e)',
              color: 'var(--text-primary, #ffffff)',
              border: '1px solid var(--border-color, #2f2f3f)',
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              outline: 'none',
              marginLeft: '0.75rem',
              fontWeight: 500
            }}
          >
            <option value="en">English 🇬🇧</option>
            <option value="hi">हिन्दी 🇮🇳</option>
            <option value="gu">ગુજરાતી 🇮🇳</option>
          </select>

          {/* Theme Selector Dropdown */}
          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
            style={{
              background: 'var(--bg-tertiary, #1f1f2e)',
              color: 'var(--text-primary, #ffffff)',
              border: '1px solid var(--border-color, #2f2f3f)',
              padding: '0.3rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              cursor: 'pointer',
              outline: 'none',
              marginLeft: '0.75rem',
              fontWeight: 500
            }}
          >
            <option value="light">☀️ {t('light') || 'Light'}</option>
            <option value="dark">🌙 {t('dark') || 'Dark'}</option>
            <option value="system">🖥️ {t('system') || 'System'}</option>
          </select>
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
