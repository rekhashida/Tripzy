import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiNavigation, 
  FiPackage, 
  FiUsers, 
  FiMap, 
  FiZap, 
  FiShield,
  FiTrendingUp,
  FiClock,
  FiUser
} from 'react-icons/fi';
import Button from '../components/Button';
import Card from '../components/Card';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <FiZap />,
      title: 'Fast Booking',
      description: 'Get matched with nearby drivers within seconds. Our smart algorithm finds the best ride for you instantly.'
    },
    {
      icon: <FiShield />,
      title: 'Secure Parcel Delivery',
      description: 'Door-to-door parcel handling with live tracking and OTP verification for complete security.'
    },
    {
      icon: <FiTrendingUp />,
      title: 'Dynamic Fares',
      description: 'Transparent fare estimation based on actual distance, duration, and local traffic multipliers.'
    }
  ];

  const driverFeatures = [
    {
      icon: <FiZap />,
      title: 'Instant Job Alerts',
      description: 'Get notified of new ride and delivery requests in your area with zero latency.'
    },
    {
      icon: <FiShield />,
      title: 'Safety Guarantee',
      description: 'Secure, authenticated rides with OTP validations at both pickup and drop-off steps.'
    },
    {
      icon: <FiUser />,
      title: 'Earnings Tracker',
      description: 'Monitor your completed jobs, daily metrics, and payouts inside your admin portal.'
    }
  ];

  const isDriver = user && user.role === 'driver';

  return (
    <>
      {isDriver ? (
        <div className="hero" style={{
          background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))'
        }}>
          <div className="hero-content">
            <h1>Drive with Tripzy, Earn on Your Terms</h1>
            <p>
              Welcome back, {user.name}! Ready to hit the road? Access your personal dashboard to go online, accept new rides, track your earnings, and view your stats.
            </p>
            <div className="hero-cta">
              <Link to="/driver">
                <Button variant="primary" size="large">
                  <FiNavigation /> Driver Dashboard
                </Button>
              </Link>
              <Link to="/my-rides">
                <Button variant="outline" size="large">
                  <FiClock /> Trip History
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="hero-illustration">
            <div className="city-grid"></div>
            <div className="animated-road"></div>
            <div className="pulse-pin pickup-pin">📍</div>
            <div className="pulse-pin dropoff-pin">🏁</div>
            <div className="driving-car-wrapper">
              <svg viewBox="0 0 120 60" className="animated-taxi" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="60" cy="50" rx="45" ry="6" fill="rgba(0,0,0,0.3)" />
                <circle cx="30" cy="45" r="11" fill="var(--bg-secondary)" stroke="var(--primary)" strokeWidth="2" />
                <circle cx="30" cy="45" r="5" fill="var(--text-primary)" />
                <circle cx="90" cy="45" r="11" fill="var(--bg-secondary)" stroke="var(--primary)" strokeWidth="2" />
                <circle cx="90" cy="45" r="5" fill="var(--text-primary)" />
                <path d="M15 35 C15 35 15 28 25 25 C35 22 45 12 60 12 C75 12 85 22 95 25 C105 28 105 35 105 35 L108 38 C108 40 102 44 95 44 L25 44 C18 44 12 40 12 38 Z" fill="#eab308" />
                <path d="M40 23 L60 23 L60 16 L48 16 Z" fill="#0f172a" />
                <path d="M64 23 L80 23 L72 16 L64 16 Z" fill="#0f172a" />
                <rect x="52" y="5" width="16" height="8" rx="2" fill="#0f172a" />
                <rect x="55" y="7" width="10" height="4" fill="#eab308" />
              </svg>
            </div>
            <div className="floating-clouds">
              <span className="cloud cloud-1">☁️</span>
              <span className="cloud cloud-2">☁️</span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))',
          padding: '3rem 1.5rem',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '520px',
          boxShadow: 'var(--shadow-xl)',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '480px',
            marginBottom: '1.5rem',
            padding: '0 0.5rem'
          }}>
            <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>☰</span>
            <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>🔔</span>
          </div>

          <div style={{
            width: '100%',
            maxWidth: '480px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '30px',
            padding: '0.8rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '2rem',
            cursor: 'pointer'
          }} onClick={() => navigate(user ? '/ride' : '/login')}>
            <span style={{ color: 'var(--primary)', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Where to?" 
              readOnly 
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '1rem',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>✖</span>
          </div>

          <div style={{
            width: '100%',
            maxWidth: '480px',
            height: '220px',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #bae6fd, #e0f2fe)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            marginBottom: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end'
          }}>
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '0',
              right: '0',
              height: '80px',
              backgroundImage: 'linear-gradient(to top, rgba(148, 163, 184, 0.4), transparent)',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              opacity: 0.8
            }}>
              <div style={{ width: '30px', height: '60px', background: '#94a3b8', borderRadius: '4px 4px 0 0' }} />
              <div style={{ width: '40px', height: '80px', background: '#cbd5e1', borderRadius: '6px 6px 0 0' }} />
              <div style={{ width: '25px', height: '50px', background: '#94a3b8', borderRadius: '3px 3px 0 0' }} />
              <div style={{ width: '35px', height: '70px', background: '#cbd5e1', borderRadius: '5px 5px 0 0' }} />
            </div>

            <span style={{ position: 'absolute', top: '15px', left: '15%', fontSize: '1.5rem', opacity: 0.7 }}>☁️</span>
            <span style={{ position: 'absolute', top: '25px', right: '20%', fontSize: '1.2rem', opacity: 0.6 }}>☁️</span>

            <svg viewBox="0 0 400 120" style={{ width: '100%', height: '110px', zIndex: 2 }}>
              <path d="M-10 120 Q50 60 150 120 Q250 50 410 120 Z" fill="#4ade80" opacity="0.9" />
              <path d="M-10 120 Q100 80 250 120 Q350 70 410 120 Z" fill="#22c55e" />
              <path d="M-20 120 C 100 80, 200 40, 300 70 C 350 80, 380 120, 420 120" fill="none" stroke="#475569" strokeWidth="32" strokeLinecap="round" />
              <path d="M-20 120 C 100 80, 200 40, 300 70 C 350 80, 380 120, 420 120" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="8 8" strokeLinecap="round" opacity="0.6" />
              
              <g transform="translate(60, 85) scale(0.4)">
                <rect x="0" y="10" width="40" height="15" rx="4" fill="#eab308" />
                <rect x="8" y="2" width="24" height="10" rx="3" fill="#1e293b" />
                <circle cx="10" cy="23" r="5" fill="#000" />
                <circle cx="30" cy="23" r="5" fill="#000" />
              </g>
              <g transform="translate(180, 50) scale(0.35)">
                <rect x="0" y="10" width="40" height="15" rx="4" fill="#eab308" />
                <rect x="8" y="2" width="24" height="10" rx="3" fill="#1e293b" />
                <circle cx="10" cy="23" r="5" fill="#000" />
                <circle cx="30" cy="23" r="5" fill="#000" />
              </g>
              <g transform="translate(290, 68) scale(0.4)">
                <rect x="0" y="10" width="40" height="15" rx="4" fill="#eab308" />
                <rect x="8" y="2" width="24" height="10" rx="3" fill="#1e293b" />
                <circle cx="10" cy="23" r="5" fill="#000" />
                <circle cx="30" cy="23" r="5" fill="#000" />
              </g>
            </svg>
          </div>

          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '900',
            color: 'var(--primary)',
            fontFamily: 'Outfit, sans-serif',
            letterSpacing: '1px',
            marginBottom: '2rem'
          }}>
            Tripzy
          </h1>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.25rem',
            width: '100%',
            maxWidth: '480px',
            marginBottom: '1rem'
          }}>
            <div 
              onClick={() => navigate(user ? '/ride' : '/login')}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '1.25rem 0.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'var(--transition)',
                boxShadow: 'var(--shadow-md)'
              }}
              className="action-card-btn"
            >
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'var(--secondary)',
                opacity: 0.95,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                marginBottom: '0.6rem',
                color: '#fff'
              }}>
                🚗
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>Ride</div>
            </div>

            <div 
              onClick={() => navigate(user ? '/parcel' : '/login')}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '1.25rem 0.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'var(--transition)',
                boxShadow: 'var(--shadow-md)'
              }}
              className="action-card-btn"
            >
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'var(--secondary)',
                opacity: 0.95,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                marginBottom: '0.6rem',
                color: '#fff'
              }}>
                📦
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>Package</div>
            </div>

            <div 
              onClick={() => navigate(user ? '/pooling' : '/login')}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '1.25rem 0.75rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'var(--transition)',
                boxShadow: 'var(--shadow-md)'
              }}
              className="action-card-btn"
            >
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'var(--secondary)',
                opacity: 0.95,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                marginBottom: '0.6rem',
                color: '#fff'
              }}>
                🛺
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>Rentals</div>
            </div>
          </div>
        </div>
      )}

      <Card 
        title={isDriver ? "Driver Benefits & Tools" : "What We Offer"} 
        subtitle={isDriver ? "Everything you need to succeed as a Tripzy partner" : "Everything you need for your transportation and delivery needs"}
      >
        <div className="features">
          {(isDriver ? driverFeatures : features).map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </Card>

      {!user && (
        <Card>
          <div className="text-center">
            <h2 style={{ marginBottom: '1rem' }}>Ready to Get Started?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Join thousands of satisfied customers and drivers who trust Tripzy every single day.
            </p>
            <Link to="/register">
              <Button variant="primary" size="large">
                Create Your Account
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </>
  );
}
