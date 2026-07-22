import React from 'react';
import { Link } from 'react-router-dom';
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
      icon: <FiUsers />,
      title: 'Ride Pooling',
      description: 'Save money and reduce your carbon footprint by sharing rides with others going the same way.'
    },
    {
      icon: <FiMap />,
      title: 'Real-time Tracking',
      description: 'Follow your ride or parcel on the map in real time. Know exactly where your driver is.'
    },
    {
      icon: <FiClock />,
      title: '24/7 Availability',
      description: 'Book rides or send parcels anytime, anywhere. We\'re always here when you need us.'
    },
    {
      icon: <FiTrendingUp />,
      title: 'Best Prices',
      description: 'Competitive pricing with transparent fare calculation. No hidden charges, ever.'
    }
  ];

  const driverFeatures = [
    {
      icon: <FiZap />,
      title: 'Smart Matching',
      description: 'Get matched with passengers within a 2km radius instantly. Maximize your driving time and reduce idle waits.'
    },
    {
      icon: <FiTrendingUp />,
      title: 'Surge Earnings',
      description: 'Earn more during peak hours (morning & evening) and late nights with dynamic request-based multipliers.'
    },
    {
      icon: <FiShield />,
      title: 'Secure OTP Handover',
      description: 'Ensure safe trips with mandatory OTP verification at both passenger pickup and drop-off points.'
    },
    {
      icon: <FiClock />,
      title: 'Flexible Hours',
      description: 'You are in control. Go online or offline whenever you want and manage your own schedule.'
    },
    {
      icon: <FiUsers />,
      title: 'Ride Pooling',
      description: 'Accept pooling rides to carry multiple passengers heading in the same direction, boosting your fuel efficiency.'
    },
    {
      icon: <FiPackage />,
      title: 'Parcel Deliveries',
      description: 'Accept couriers and package deliveries alongside rides to expand your earnings variety.'
    }
  ];

  const isDriver = user && user.role === 'driver';

  return (
    <>
      <div className="hero" style={{
        background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))'
      }}>
        <div className="hero-content">
          {isDriver ? (
            <>
              <h1>Drive with Tripzy, Earn on Your Terms</h1>
              <p>
                Welcome back, {user.name}! Ready to hit the road? Access your personal dashboard to go online, accept new rides, track your earnings, and view your stats.
              </p>
            </>
          ) : (
            <>
              <h1>Your Journey, Our Priority</h1>
              <p>
                Experience seamless ride booking, reliable parcel delivery, and smart ride pooling — 
                all in one beautiful, modern platform. Book your next trip with confidence.
              </p>
            </>
          )}
          <div className="hero-cta">
            {user ? (
              isDriver ? (
                <>
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
                </>
              ) : (
                <>
                  <Link to="/ride">
                    <Button variant="primary" size="large">
                      <FiNavigation /> Book a Ride
                    </Button>
                  </Link>
                  <Link to="/parcel">
                    <Button variant="secondary" size="large">
                      <FiPackage /> Send Parcel
                    </Button>
                  </Link>
                  <Link to="/pooling">
                    <Button variant="primary" size="large">
                      <FiUsers /> Join Pooling
                    </Button>
                  </Link>
                </>
              )
            ) : (
              <>
                <Link to="/register">
                  <Button variant="primary" size="large">
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="large">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
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
