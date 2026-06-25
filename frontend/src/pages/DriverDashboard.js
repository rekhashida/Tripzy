import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTruck, FiPlay, FiCheckCircle, FiMap, FiPower, FiMapPin, FiDollarSign, FiStar, FiUser } from 'react-icons/fi';
import api from '../services/api';
import { connectDriver, onNewRide, offNewRide, onRideAssigned, offRideAssigned } from '../services/socket';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const statusLabel = {
  pending: 'Pending',
  driver_assigned: 'Assigned',
  otp_verified: 'Verified',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export default function DriverDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otpInputs, setOtpInputs] = useState({});
  const [locationStatus, setLocationStatus] = useState('');
  const [matchingRides, setMatchingRides] = useState([]);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/driver/dashboard');
      setDashboard(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load driver dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const loadMatchingRides = async () => {
    try {
      const { data } = await api.get('/driver/requests');
      setMatchingRides(data || []);
    } catch (err) {
      // ignore; will show in dashboard if needed
    }
  };

  useEffect(() => {
    loadDashboard();
    loadMatchingRides();
  }, []);

  useEffect(() => {
    if (!dashboard?.driver?.id) return;

    connectDriver(dashboard.driver.id);

    const handleNewRide = (ride) => {
      setMatchingRides((prev) => [ride, ...prev].slice(0, 25));
      addToast(`New nearby ride request (#${ride.rideId})`);
    };

    const handleAssigned = ({ rideId }) => {
      addToast(`Ride #${rideId} assigned to you.`);
      loadDashboard();
      loadMatchingRides();
    };

    onNewRide(handleNewRide);
    onRideAssigned(handleAssigned);

    return () => {
      offNewRide();
      offRideAssigned();
    };
  }, [dashboard?.driver?.id]);

  const updateAvailability = async (isOnline) => {
    try {
      await api.put('/driver/availability', { is_online: isOnline });
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to change availability.');
    }
  };

  const handleAcceptRide = async (rideId) => {
    try {
      await api.post(`/driver/rides/${rideId}/accept`);
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to accept ride.');
    }
  };

  const handleRideAction = async (rideId, action) => {
    const otp = otpInputs[rideId] || '';
    if (!otp.trim()) {
      setError('Please enter the OTP provided by the rider.');
      return;
    }
    try {
      await api.post(`/driver/rides/${rideId}/status`, { action, otp });
      setOtpInputs((prev) => ({ ...prev, [rideId]: '' }));
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed.');
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('Locating…');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await api.post('/tracking/driver-location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationStatus('Location broadcasted to riders.');
        } catch (err) {
          setLocationStatus('Failed to send location.');
        }
      },
      () => {
        setLocationStatus('Unable to retrieve your location.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  if (loading) return <Loading message="Loading driver dashboard…" />;

  if (error) {
    return (
      <Card>
        <div className="text-center" style={{ padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
          <Button variant="primary" onClick={loadDashboard}>Try again</Button>
        </div>
      </Card>
    );
  }

  const { driver, stats, rides } = dashboard || {};

  if (!driver) {
    return (
      <Card>
        <div className="text-center" style={{ padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Driver profile not found. Please ensure you registered as a driver.</p>
          <Button variant="primary" onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              style={{
                minWidth: '260px',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(30, 41, 59, 0.95)',
                color: 'white',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
              }}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}

      <Card>
        <div className="card-header">
          <div>
            <h1 className="card-title">
              <FiTruck style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Driver Dashboard
            </h1>
            <p className="card-subtitle">
              Manage your availability, see assigned rides, and keep your earnings on track.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant={driver.is_online ? 'secondary' : 'primary'}
              onClick={() => updateAvailability(!driver.is_online)}
              style={{ whiteSpace: 'nowrap' }}
            >
              <FiPower /> {driver.is_online ? 'Go Offline' : 'Go Online'}
            </Button>
            <Button variant="outline" onClick={handleShareLocation}>
              Share Location
            </Button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalTrips}</div>
            <div className="stat-label">Total Trips</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {parseFloat(stats.rating || 0).toFixed(1)} <FiStar style={{ marginLeft: '0.5rem', color: 'var(--warning)' }} />
            </div>
            <div className="stat-label">Driver Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">₹{parseFloat(stats.earnings || 0).toFixed(2)}</div>
            <div className="stat-label">Earnings</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.activeRides}</div>
            <div className="stat-label">Active Assignments</div>
          </div>
        </div>

        <div style={{ margin: '2rem 0' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Earnings (Last 6 Months)</h2>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.earningsByMonth} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-primary)' }}
                  formatter={(value) => [`₹${value}`, 'Earnings']}
                />
                <Bar dataKey="earnings" fill="rgba(99, 102, 241, 0.8)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Card style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ fontSize: '1.25rem' }}>Nearby Ride Requests</h2>
              <p className="card-subtitle" style={{ marginTop: '0.25rem' }}>
                Accept requests near your current location. Keep sharing location for accurate matching.
              </p>
            </div>
            <Button variant="outline" onClick={loadMatchingRides}>
              Refresh
            </Button>
          </div>

          {matchingRides.length === 0 ? (
            <div className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: '0.5rem' }}>No nearby requests right now.</p>
              <p style={{ fontSize: '0.9rem' }}>Ensure you're online and sharing your location to receive requests.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {matchingRides.map((ride) => (
                <div key={ride.id} className="list-item" style={{ padding: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700 }}>#{ride.id}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{ride.distance_km} km away</span>
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <FiMapPin style={{ color: 'var(--success)' }} />
                        <span>{ride.pickup_address || `${ride.pickup_lat}, ${ride.pickup_lng}`}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                        <FiMapPin style={{ color: 'var(--danger)' }} />
                        <span>{ride.drop_address || `${ride.drop_lat}, ${ride.drop_lng}`}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '160px' }}>
                    <Button variant="primary" onClick={() => handleAcceptRide(ride.id)}>
                      <FiPlay /> Accept
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setOtpInputs((prev) => ({ ...prev, [ride.id]: '' }));
                      addToast(`Ride #${ride.id} selected. Enter OTP from rider to start.`);
                    }}>
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {locationStatus && (
          <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
            {locationStatus}
          </div>
        )}

        {rides.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
            <FiMap style={{ fontSize: '3rem', marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No rides assigned yet.</p>
            <p>Keep your status online so riders can request you.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {rides.map((ride) => (
              <div key={ride.id} className="list-item">
                <div className="list-item-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>#{ride.id}</span>
                    <Badge status={ride.status}>{statusLabel[ride.status] || ride.status}</Badge>
                    {ride.vehicle_type && <Badge status="in_progress">{ride.vehicle_type}</Badge>}
                  </div>

                  <div className="list-item-title" style={{ marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <FiMapPin style={{ color: 'var(--success)', marginTop: '0.25rem' }} />
                      <span>{ride.pickup_address || 'Pickup location'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <FiMapPin style={{ color: 'var(--danger)', marginTop: '0.25rem' }} />
                      <span>{ride.drop_address || 'Drop location'}</span>
                    </div>
                  </div>

                  <div className="list-item-subtitle" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                    {ride.fare && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiDollarSign /> ₹{ride.fare}
                      </span>
                    )}
                    {ride.distance_km && <span>{ride.distance_km} km</span>}
                    {ride.duration_min && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiTruck /> {ride.duration_min} min
                      </span>
                    )}
                    {ride.rider_name && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiUser /> {ride.rider_name}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '160px' }}>
                  {(ride.status === 'pending' || ride.status === 'driver_assigned') && (
                    <Button variant="primary" onClick={() => handleAcceptRide(ride.id)}>
                      <FiPlay /> Accept
                    </Button>
                  )}

                  {['driver_assigned', 'otp_verified', 'in_progress'].includes(ride.status) && (
                    <>
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        className="form-input"
                        value={otpInputs[ride.id] || ''}
                        onChange={(e) => setOtpInputs((prev) => ({ ...prev, [ride.id]: e.target.value }))}
                        style={{ width: '100%', marginBottom: '0.5rem' }}
                      />
                      <Button
                        variant="secondary"
                        onClick={() => handleRideAction(ride.id, ride.status === 'in_progress' ? 'complete' : 'start')}
                      >
                        <FiCheckCircle /> {ride.status === 'in_progress' ? 'Complete Ride' : 'Start Ride'}
                      </Button>
                    </>
                  )}

                  {(ride.status === 'in_progress' || ride.status === 'driver_assigned' || ride.status === 'otp_verified') && (
                    <Link to={`/tracking/${ride.id}`}>
                      <Button variant="outline" style={{ whiteSpace: 'nowrap' }}>
                        <FiMap /> Track
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
