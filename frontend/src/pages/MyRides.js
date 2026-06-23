import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMap, FiNavigation, FiClock, FiDollarSign, FiUser, FiMapPin } from 'react-icons/fi';
import api from '../services/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Loading from '../components/Loading';

export default function MyRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      const { data } = await api.get('/rides/my');
      setRides(data || []);
    } catch (e) {
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRides = filter === 'all' 
    ? rides 
    : rides.filter(ride => ride.status === filter);

  if (loading) {
    return <Loading message="Loading your rides..." />;
  }

  return (
    <>
      <Card>
        <div className="card-header">
          <h1 className="card-title">
            <FiMap style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            My Rides
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilter('all')}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              All
            </Button>
            <Button
              variant={filter === 'pending' ? 'primary' : 'outline'}
              onClick={() => setFilter('pending')}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'in_progress' ? 'primary' : 'outline'}
              onClick={() => setFilter('in_progress')}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              In Progress
            </Button>
            <Button
              variant={filter === 'completed' ? 'primary' : 'outline'}
              onClick={() => setFilter('completed')}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Completed
            </Button>
          </div>
        </div>

        {rides.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
            <FiNavigation style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No rides yet</p>
            <Link to="/ride">
              <Button variant="primary">Book Your First Ride</Button>
            </Link>
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
            <p>No rides found with this filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredRides.map((ride) => (
              <div key={ride.id} className="list-item">
                <div className="list-item-content" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>#{ride.id}</span>
                    <Badge status={ride.status}>{ride.status}</Badge>
                    {ride.vehicle_type && (
                      <Badge status="in_progress">{ride.vehicle_type}</Badge>
                    )}
                  </div>
                  
                  <div className="list-item-title" style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <FiMapPin style={{ color: 'var(--success)', marginTop: '0.25rem' }} />
                      <span>{ride.pickup_address || 'Pickup location'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <FiMapPin style={{ color: 'var(--danger)', marginTop: '0.25rem' }} />
                      <span>{ride.drop_address || 'Drop location'}</span>
                    </div>
                  </div>

                  <div className="list-item-subtitle" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {ride.fare && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiDollarSign /> ₹{ride.fare}
                      </span>
                    )}
                    {ride.distance_km && (
                      <span>{ride.distance_km} km</span>
                    )}
                    {ride.duration_min && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiClock /> {ride.duration_min} min
                      </span>
                    )}
                    {ride.driver_name && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiUser /> {ride.driver_name}
                      </span>
                    )}
                  </div>

                  {ride.created_at && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Booked on {new Date(ride.created_at).toLocaleString()}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(ride.status === 'in_progress' || ride.status === 'driver_assigned' || ride.status === 'otp_verified') && (
                    <Link to={`/tracking/${ride.id}`}>
                      <Button variant="primary" style={{ whiteSpace: 'nowrap' }}>
                        <FiMap /> Track
                      </Button>
                    </Link>
                  )}
                  {ride.status === 'completed' && (
                    <Link to={`/tracking/${ride.id}`}>
                      <Button variant="outline" style={{ whiteSpace: 'nowrap' }}>
                        View Details
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
