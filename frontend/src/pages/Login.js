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
  
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, loginWithGoogle, loginWithOtp } = useAuth();
  const navigate = useNavigate();

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

  /* global google */
  const handleGoogleCredentialResponse = async (response) => {
    setErr('');
    setLoading(true);
    try {
      await loginWithGoogle(response.credential);
      navigate('/');
    } catch (res) {
      setErr(res.response?.data?.error || 'Google login failed.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const initializeGoogle = () => {
      if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '928961312935-nqqsqa4c9f0nsdeiouv09l74hud0eukl.apps.googleusercontent.com',
          callback: handleGoogleCredentialResponse
        });
        
        google.accounts.id.renderButton(
          document.getElementById("googleSignInDiv"),
          { 
            theme: "outline", 
            size: "large", 
            width: "384",
            type: "standard",
            text: "continue_with"
          }
        );
      }
    };

    if (typeof google === 'undefined') {
      const interval = setInterval(() => {
        if (typeof google !== 'undefined') {
          initializeGoogle();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    } else {
      initializeGoogle();
    }
  }, []);

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

        {otpSent && (
          receivedOtp ? (
            <div className="alert alert-info" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
              💬 <strong>Simulated SMS Received:</strong> Your Tripzy Login OTP is <strong>{receivedOtp}</strong> (valid for 5 mins).
            </div>
          ) : (
            <div className="alert alert-success" style={{ marginBottom: '1.5rem', borderLeft: '4px solid #10b981' }}>
              📩 <strong>Verification Code Sent:</strong> A 6-digit OTP has been sent to your mobile device. Please check your SMS.
            </div>
          )
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

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div id="googleSignInDiv" style={{ width: '100%' }}></div>
        </div>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          New here?{' '}
          <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
