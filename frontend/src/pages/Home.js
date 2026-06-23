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
  FiClock
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

  return (
    <>
      <div className="hero">
        <div className="hero-content">
          <h1>Your Journey, Our Priority</h1>
          <p>
            Experience seamless ride booking, reliable parcel delivery, and smart ride pooling — 
            all in one beautiful, modern platform. Book your next trip with confidence.
          </p>
          <div className="hero-cta">
            {user ? (
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
      </div>

      <Card title="What We Offer" subtitle="Everything you need for your transportation and delivery needs">
        <div className="features">
          {features.map((feature, index) => (
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
              Join thousands of satisfied customers who trust Tripzy for their transportation needs.
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
