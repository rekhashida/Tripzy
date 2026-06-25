import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiLogIn, FiPhone, FiSmartphone, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';

export default function Login() {
  const [loginMode, setLoginMode] = useState('email'); // 'email' or 'otp'
  
  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Mobile state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [receivedOtp, setReceivedOtp] = useState('');
  
  // Google state
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, loginWithGoogle, loginWithOtp } = useAuth();
  const navigate = useNavigate();

  const googleAccounts = [
    { name: 'Jayraj Chavda', email: 'jayraj@gmail.com' },
    { name: 'Heet Bhoraniya', email: 'heet@gmail.com' },
    { name: 'Ridham Ponkiya', email: 'ridham@gmail.com' },
    { name: 'Rekha Sida', email: 'rekhashida5@gmail.com' },
    { name: 'Rekha Shida (Driver)', email: 'rekhashida1306@gmail.com' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (res) {
      setErr(res.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone) {
      setErr('Please enter phone number.');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/send-otp', { phone });
      setOtpSent(true);
      setReceivedOtp(data.otp); // Save received OTP for demo display
    } catch (res) {
      setErr(res.response?.data?.error || 'Failed to send OTP. Ensure your number is registered.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLoginSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      setErr('Please enter the OTP.');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      await loginWithOtp(phone, otp);
      navigate('/');
    } catch (res) {
      setErr(res.response?.data?.error || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSelect = async (account) => {
    setGoogleModalOpen(false);
    setErr('');
    setLoading(true);
    try {
      await loginWithGoogle(account.email, account.name);
      navigate('/');
    } catch (res) {
      setErr(res.response?.data?.error || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto' }}>
      <Card>
        <div className="text-center mb-4">
          <h1 className="card-title">Welcome Back</h1>
          <p className="card-subtitle">
            {loginMode === 'email' ? 'Sign in to continue to Tripzy' : 'Sign in using your mobile number'}
          </p>
        </div>

        {err && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
            {err}
          </div>
        )}

        {receivedOtp && (
          <div className="alert alert-info" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
            💬 <strong>Simulated SMS Received:</strong> Your Tripzy Login OTP is <strong>{receivedOtp}</strong> (valid for 5 mins).
          </div>
        )}

        {loginMode === 'email' ? (
          <form onSubmit={handleSubmit}>
            <Input
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />

            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
              style={{ marginTop: '1rem' }}
            >
              {loading ? 'Signing in...' : (
                <>
                  <FiLogIn /> Sign In
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleOtpLoginSubmit : (e) => { e.preventDefault(); handleSendOtp(); }}>
            <Input
              type="text"
              label="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              disabled={otpSent || loading}
              required
            />

            {otpSent && (
              <Input
                type="text"
                label="Verification Code (OTP)"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
              />
            )}

            {!otpSent ? (
              <Button
                type="button"
                variant="primary"
                className="w-full"
                onClick={handleSendOtp}
                disabled={loading || !phone}
                style={{ marginTop: '1rem' }}
              >
                {loading ? 'Sending OTP...' : (
                  <>
                    <FiSmartphone /> Send OTP
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading || !otp}
                style={{ marginTop: '1rem' }}
              >
                {loading ? 'Verifying OTP...' : (
                  <>
                    <FiCheckCircle /> Verify & Login
                  </>
                )}
              </Button>
            )}
          </form>
        )}

        <div style={{ textAlign: 'center', margin: '1rem 0' }}>
          <button 
            type="button" 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--primary-light)', 
              cursor: 'pointer', 
              fontSize: '0.85rem',
              fontWeight: 600,
              textDecoration: 'underline'
            }}
            onClick={() => {
              setLoginMode(loginMode === 'email' ? 'otp' : 'email');
              setErr('');
              setReceivedOtp('');
              setOtpSent(false);
              setPhone('');
              setOtp('');
            }}
          >
            {loginMode === 'email' ? 'Login using Mobile OTP' : 'Login using Email & Password'}
          </button>
        </div>

        <div style={{ textAlign: 'center', margin: '1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <hr style={{ flex: 1, borderColor: 'var(--border-color)', opacity: 0.3 }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>OR</span>
          <hr style={{ flex: 1, borderColor: 'var(--border-color)', opacity: 0.3 }} />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          onClick={() => setGoogleModalOpen(true)}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          New here?{' '}
          <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
            Create an account
          </Link>
        </p>
      </Card>

      <Modal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        title="Sign in with Google"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Choose an account to continue to <strong>Tripzy</strong>
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {googleAccounts.map((acc, idx) => (
              <button
                key={idx}
                onClick={() => handleGoogleSelect(acc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
              >
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  background: 'var(--primary)', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.95rem'
                }}>
                  {acc.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{acc.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{acc.email}</div>
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <Button variant="outline" onClick={() => setGoogleModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
