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
  FiUser,
  FiMic
} from 'react-icons/fi';
import Button from '../components/Button';
import Card from '../components/Card';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isDriver = user && user.role === 'driver';

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

  const modulesShowcase = [
    {
      title: 'Instant Ride Booking',
      icon: '🚗',
      badge: 'Core Module',
      badgeColor: '#3b82f6',
      desc: 'Get matched with nearby drivers within seconds. Features live mapping, vehicle tiers (Economy to SUV), and dynamic pricing.',
      link: '/ride'
    },
    {
      title: 'Safe Parcel Delivery',
      icon: '📦',
      badge: 'On-Demand',
      badgeColor: '#f59e0b',
      desc: 'Send documents or packages door-to-door. Choose luggage size tiers and monitor courier milestones in real time.',
      link: '/parcel'
    },
    {
      title: 'Smart Ride Pooling',
      icon: '👥',
      badge: 'Eco-Friendly',
      badgeColor: '#10b981',
      desc: 'Reduce travel expenses and carbon emissions. Share routes with passengers going in your direction.',
      link: '/pooling'
    },
    {
      title: 'Voice-Activated Booking',
      icon: '🎙️',
      badge: 'AI Powered',
      badgeColor: '#8b5cf6',
      desc: 'Book rides hands-free. Speaks English, Hindi, and Gujarati, resolving pickup and drop coordinates instantly.',
      link: '/voice-booking'
    },
    {
      title: 'Real-Time Map Tracking',
      icon: '🗺️',
      badge: 'Security',
      badgeColor: '#ef4444',
      desc: 'Track active rides on a detailed interactive canvas. Share trip statuses and view live driver progress.',
      link: '/my-rides'
    }
  ];

  return (
    <>
      {isDriver ? (
        <div className="hero" style={{
          background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))',
          width: '100%',
          maxWidth: '100%'
        }}>
          <div className="hero-content" style={{ maxWidth: '100%' }}>
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
          padding: '3rem 2.5rem',
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
          marginBottom: '2.5rem',
          width: '100%',
          maxWidth: '100%'
        }}>
          {/* Top Header Row - Full Width */}
          <div style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            padding: '0 1rem'
          }}>
            <span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>☰</span>
            <span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>🔔</span>
          </div>

          {/* Search Bar - Full Width */}
          <div style={{
            width: '100%',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '30px',
            padding: '1rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '2.5rem',
            cursor: 'pointer'
          }} 
          className="search-bar-hover"
          onClick={() => navigate(user ? '/ride' : '/login')}>
            <span style={{ color: 'var(--primary)', fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Where to?" 
              readOnly 
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
                fontSize: '1.15rem',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>✖</span>
          </div>

          {/* Winding Road Illustration - Stretched Full Width */}
          <div style={{
            width: '100%',
            height: '240px',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #bae6fd, #e0f2fe)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            marginBottom: '2.5rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            {/* Skyline */}
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
              <div style={{ width: '40px', height: '80px', background: '#cbd5e1', borderRadius: '6px 6px 0 0' }} />
              <div style={{ width: '30px', height: '60px', background: '#94a3b8', borderRadius: '4px 4px 0 0' }} />
              <div style={{ width: '50px', height: '100px', background: '#cbd5e1', borderRadius: '6px 6px 0 0' }} />
              <div style={{ width: '35px', height: '70px', background: '#94a3b8', borderRadius: '5px 5px 0 0' }} />
              <div style={{ width: '45px', height: '90px', background: '#cbd5e1', borderRadius: '6px 6px 0 0' }} />
              <div style={{ width: '35px', height: '65px', background: '#94a3b8', borderRadius: '4px 4px 0 0' }} />
              <div style={{ width: '55px', height: '105px', background: '#cbd5e1', borderRadius: '6px 6px 0 0' }} />
            </div>

            {/* Clouds */}
            <span className="cloud cloud-1" style={{ position: 'absolute', top: '15px', left: '10%', fontSize: '1.8rem', opacity: 0.8 }}>☁️</span>
            <span className="cloud cloud-2" style={{ position: 'absolute', top: '25px', right: '15%', fontSize: '1.5rem', opacity: 0.7 }}>☁️</span>

            {/* Winding road SVG */}
            <svg viewBox="0 0 1000 120" style={{ width: '100%', height: '120px', position: 'absolute', bottom: 0, left: 0, zIndex: 2 }}>
              <path d="M-10 120 Q200 50 500 120 Q800 40 1010 120 Z" fill="#4ade80" opacity="0.9" />
              <path d="M-10 120 Q250 80 600 120 Q850 60 1010 120 Z" fill="#22c55e" />
              <path d="M-20 120 C 250 80, 500 40, 750 70 C 850 80, 920 120, 1020 120" fill="none" stroke="#475569" strokeWidth="36" strokeLinecap="round" />
              <path d="M-20 120 C 250 80, 500 40, 750 70 C 850 80, 920 120, 1020 120" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="10 10" strokeLinecap="round" opacity="0.7" />
              
              {/* Animated taxis */}
              <g transform="translate(150, 65) scale(0.55)">
                <rect x="0" y="10" width="40" height="15" rx="4" fill="#eab308" />
                <rect x="8" y="2" width="24" height="10" rx="3" fill="#1e293b" />
                <circle cx="10" cy="23" r="5" fill="#000" />
                <circle cx="30" cy="23" r="5" fill="#000" />
              </g>
              <g transform="translate(480, 42) scale(0.5)">
                <rect x="0" y="10" width="40" height="15" rx="4" fill="#eab308" />
                <rect x="8" y="2" width="24" height="10" rx="3" fill="#1e293b" />
                <circle cx="10" cy="23" r="5" fill="#000" />
                <circle cx="30" cy="23" r="5" fill="#000" />
              </g>
              <g transform="translate(790, 58) scale(0.55)">
                <rect x="0" y="10" width="40" height="15" rx="4" fill="#eab308" />
                <rect x="8" y="2" width="24" height="10" rx="3" fill="#1e293b" />
                <circle cx="10" cy="23" r="5" fill="#000" />
                <circle cx="30" cy="23" r="5" fill="#000" />
              </g>
            </svg>
          </div>

          {/* Centered Brand Title */}
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '900',
            color: 'var(--primary)',
            fontFamily: 'Outfit, sans-serif',
            letterSpacing: '1px',
            marginBottom: '2.5rem'
          }}>
            Tripzy
          </h1>

          {/* Action Grid - Full Width */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2rem',
            width: '100%',
            marginBottom: '1.5rem'
          }}>
            <div 
              onClick={() => navigate(user ? '/ride' : '/login')}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '2.5rem 1.5rem',
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
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: 'var(--secondary)',
                opacity: 0.95,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '1rem',
                color: '#fff'
              }}>
                🚗
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)' }}>Ride</div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Book a private ride instantly</p>
            </div>

            <div 
              onClick={() => navigate(user ? '/parcel' : '/login')}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '2.5rem 1.5rem',
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
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: 'var(--secondary)',
                opacity: 0.95,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '1rem',
                color: '#fff'
              }}>
                📦
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)' }}>Package</div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Send and track couriers safely</p>
            </div>

            <div 
              onClick={() => navigate(user ? '/pooling' : '/login')}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '2.5rem 1.5rem',
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
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: 'var(--secondary)',
                opacity: 0.95,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '1rem',
                color: '#fff'
              }}>
                👥
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-primary)' }}>Ride Sharing</div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Join pools and share expenses</p>
            </div>
          </div>
        </div>
      )}

      {isDriver ? (
        <Card 
          title="Driver Benefits & Tools" 
          subtitle="Everything you need to succeed as a Tripzy partner"
          style={{ width: '100%', maxWidth: '100%' }}
        >
          <div className="features" style={{ width: '100%', maxWidth: '100%' }}>
            {driverFeatures.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div style={{
          width: '100%',
          margin: '3rem auto 4rem auto',
          padding: '0'
        }}>
          <h2 style={{
            fontSize: '2.4rem',
            fontWeight: '800',
            textAlign: 'center',
            marginBottom: '0.5rem',
            color: 'var(--text-primary)'
          }}>
            Explore Our Modules
          </h2>
          <p style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            marginBottom: '3rem',
            fontSize: '1.1rem'
          }}>
            Premium components designed for seamless on-demand transport and logistics
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            width: '100%'
          }}>
            {modulesShowcase.map((mod, index) => (
              <div 
                key={index}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-md)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                className="action-card-btn"
                onClick={() => navigate(user ? mod.link : '/login')}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  background: mod.badgeColor
                }} />

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>{mod.icon}</span>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '20px',
                      background: 'var(--bg-tertiary)',
                      color: mod.badgeColor,
                      border: `1px solid ${mod.badgeColor}`
                    }}>
                      {mod.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                    {mod.title}
                  </h3>
                  
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1.5rem' }}>
                    {mod.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '0.95rem', color: 'var(--primary)' }}>
                  Open Module <span style={{ transition: 'transform 0.2s' }}>→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!user && (
        <Card style={{ width: '100%', maxWidth: '100%' }}>
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
