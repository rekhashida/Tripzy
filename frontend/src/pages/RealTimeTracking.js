import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiMap, FiNavigation, FiMapPin, FiClock, FiDollarSign, FiUser, FiPhone, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import { joinRideRoom, leaveRideRoom, onLocationUpdate, offLocationUpdate } from '../services/socket';
import Map from '../components/Map';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Modal from '../components/Modal';
import Input from '../components/Input';

export default function RealTimeTracking() {
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [driverLoc, setDriverLoc] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpType, setOtpType] = useState('pickup');
  const [otp, setOtp] = useState('');
  const [otpMsg, setOtpMsg] = useState('');
  const [eta, setEta] = useState(null);
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.warn('Geolocation error:', err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  useEffect(() => {
    loadRide();
    joinRideRoom(rideId);
    const handler = (loc) => {
      setDriverLoc(loc);
    };
    onLocationUpdate(handler);
    return () => {
      leaveRideRoom(rideId);
      offLocationUpdate();
    };
  }, [rideId]);

  useEffect(() => {
    const computeEta = () => {
      if (!ride?.started_at || !ride?.duration_min) {
        setEta(null);
        return;
      }
      const started = new Date(ride.started_at);
      const durationMs = ride.duration_min * 60 * 1000;
      const end = new Date(started.getTime() + durationMs);
      const now = new Date();
      const remainingMs = end - now;
      if (remainingMs <= 0) {
        setEta('Arriving soon');
        return;
      }
      const mins = Math.ceil(remainingMs / 60000);
      setEta(`${mins} min`);
    };

    computeEta();
    const interval = setInterval(computeEta, 30000);
    return () => clearInterval(interval);
  }, [ride]);

  const loadRide = async () => {
    try {
      const { data } = await api.get(`/tracking/ride/${rideId}`);
      setRide(data);
      setDriverLoc(data.driverLocation);
    } catch (e) {
      setErr(e.response?.data?.error || 'Ride not found');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp) {
      setOtpMsg('Please enter OTP');
      return;
    }
    try {
      const endpoint = otpType === 'pickup' 
        ? `/rides/${rideId}/verify-pickup`
        : `/rides/${rideId}/verify-drop`;
      await api.post(endpoint, { otp });
      setOtpMsg('OTP verified successfully!');
      setOtpModalOpen(false);
      setOtp('');
      loadRide();
    } catch (e) {
      setOtpMsg(e.response?.data?.error || 'Invalid OTP');
    }
  };

  if (loading) {
    return <Loading message="Loading ride details..." />;
  }

  if (err) {
    return (
      <Card>
        <div className="alert alert-error">{err}</div>
        <Link to="/my-rides">
          <Button variant="primary">Back to My Rides</Button>
        </Link>
      </Card>
    );
  }

  if (!ride) {
    return <Loading message="Loading ride..." />;
  }

  const path = ride.pickup_lat && ride.pickup_lng && ride.drop_lat && ride.drop_lng
    ? [
        { lat: ride.pickup_lat, lng: ride.pickup_lng },
        { lat: ride.drop_lat, lng: ride.drop_lng }
      ]
    : [];

  const markers = [
    ride.pickup_lat && ride.pickup_lng 
      ? { lat: ride.pickup_lat, lng: ride.pickup_lng, title: 'Pickup', label: 'P' }
      : null,
    ride.drop_lat && ride.drop_lng
      ? { lat: ride.drop_lat, lng: ride.drop_lng, title: 'Drop', label: 'D' }
      : null,
    driverLoc && driverLoc.latitude && driverLoc.longitude
      ? { lat: driverLoc.latitude, lng: driverLoc.longitude, title: 'Driver', label: 'D' }
      : null,
  ].filter(Boolean);

  const mapCenter = driverLoc && driverLoc.latitude
    ? { lat: driverLoc.latitude, lng: driverLoc.longitude }
    : ride.pickup_lat && ride.pickup_lng
    ? { lat: ride.pickup_lat, lng: ride.pickup_lng }
    : { lat: 23.0225, lng: 72.5714 };

  return (
    <>
      <Card>
        <div className="card-header">
          <h1 className="card-title">
            <FiMap style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Real-Time Tracking - Ride #{rideId}
          </h1>
          <Badge status={ride.status}>{ride.status}</Badge>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <Map
            center={mapCenter}
            zoom={15}
            markers={markers}
            path={path}
            height={500}
          />
          {eta && (
            <div className="alert alert-info" style={{ marginTop: '1rem' }}>
              <strong>ETA:</strong> {eta}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <Card style={{ background: 'var(--bg-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <FiMapPin style={{ color: 'var(--success)' }} />
              <strong>Pickup</strong>
            </div>
            <p>{ride.pickup_address || `${ride.pickup_lat}, ${ride.pickup_lng}`}</p>
          </Card>

          <Card style={{ background: 'var(--bg-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <FiMapPin style={{ color: 'var(--danger)' }} />
              <strong>Drop</strong>
            </div>
            <p>{ride.drop_address || `${ride.drop_lat}, ${ride.drop_lng}`}</p>
          </Card>

          <Card style={{ background: 'var(--bg-tertiary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <FiDollarSign style={{ color: 'var(--primary-light)' }} />
              <strong>Fare</strong>
            </div>
            <p>₹{ride.fare}</p>
          </Card>
        </div>

        {ride.driver_name && (
          <Card style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiUser /> Driver Information
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {ride.driver_rating && (
                  <Badge variant="warning" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                    ⭐ {parseFloat(ride.driver_rating).toFixed(1)}
                  </Badge>
                )}
                {(ride.vehicle_type === 'bike' || ride.vehicle_type === 'auto') && (
                  <Badge variant="success" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                    🌿 Eco Driver
                  </Badge>
                )}
                <Badge variant="info" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                  ⚡ Quick Responder
                </Badge>
              </div>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Name</div>
                <div style={{ fontWeight: 600 }}>{ride.driver_name}</div>
              </div>
              {ride.vehicle_number && (
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Vehicle</div>
                  <div style={{ fontWeight: 600 }}>{ride.vehicle_number}</div>
                </div>
              )}
              {ride.vehicle_type && (
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Type</div>
                  <div style={{ fontWeight: 600 }}>{ride.vehicle_type}</div>
                </div>
              )}
              {ride.driver_phone && (
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Phone</div>
                  <div style={{ fontWeight: 600 }}>{ride.driver_phone}</div>
                </div>
              )}
            </div>
          </Card>
        )}

        {driverLoc && driverLoc.latitude && (
          <Card style={{ background: 'var(--bg-tertiary)', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiNavigation /> Live Driver Location
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Lat: {driverLoc.latitude.toFixed(6)}, Lng: {driverLoc.longitude.toFixed(6)}
              {driverLoc.at && ` (Updated: ${new Date(driverLoc.at).toLocaleTimeString()})`}
            </p>
          </Card>
        )}

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {ride.status === 'driver_assigned' && ride.pickup_otp && (
            <Button
              variant="primary"
              onClick={() => {
                setOtpType('pickup');
                setOtpModalOpen(true);
              }}
            >
              <FiCheckCircle /> Verify Pickup OTP
            </Button>
          )}
          {ride.status === 'otp_verified' && ride.drop_otp && (
            <Button
              variant="secondary"
              onClick={() => {
                setOtpType('drop');
                setOtpModalOpen(true);
              }}
            >
              <FiCheckCircle /> Verify Drop OTP
            </Button>
          )}
          <Link to="/my-rides">
            <Button variant="outline">Back to My Rides</Button>
          </Link>
        </div>
      </Card>

      <Modal
        isOpen={otpModalOpen}
        onClose={() => {
          setOtpModalOpen(false);
          setOtp('');
          setOtpMsg('');
        }}
        title={`Verify ${otpType === 'pickup' ? 'Pickup' : 'Drop'} OTP`}
      >
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Enter the OTP shared by the driver to verify {otpType === 'pickup' ? 'pickup' : 'drop'}.
          </p>
          {ride[`${otpType}_otp`] && (
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              Expected OTP: {ride[`${otpType}_otp`]} (for testing)
            </div>
          )}
          <Input
            type="text"
            label="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
          />
          {otpMsg && (
            <div className={`alert alert-${otpMsg.includes('success') ? 'success' : 'error'}`} style={{ marginTop: '1rem' }}>
              {otpMsg}
            </div>
          )}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Button variant="primary" onClick={verifyOTP} className="flex-1">
              Verify OTP
            </Button>
            <Button variant="outline" onClick={() => setOtpModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Emergency Sharing Section */}
      {ride && (
        <Card style={{ background: 'var(--bg-secondary)', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
            🛡️ Safety Shield
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Enter a trusted contact to simulate sending an emergency live tracking SMS link.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1', minWidth: '200px' }}>
              <Input
                label="Emergency Contact Phone"
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="e.g. +91 99999 99999"
              />
            </div>
            <Button variant="primary" onClick={() => setShowSmsModal(true)} disabled={!emergencyPhone}>
              Simulate Emergency Share
            </Button>
          </div>
        </Card>
      )}

      <Modal
        isOpen={showSmsModal}
        onClose={() => setShowSmsModal(false)}
        title="Simulated Emergency SMS Sent"
      >
        <div style={{ padding: '1rem 0', fontFamily: 'monospace' }}>
          <div style={{ 
            background: '#1e293b', 
            color: '#38bdf8', 
            padding: '1.25rem', 
            borderRadius: '8px', 
            border: '1px solid #38bdf8',
            position: 'relative'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
              📱 To: {emergencyPhone} | Via Tripzy Safety Server
            </div>
            <p style={{ fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
              Hey, I am on a Tripzy ride. Here are my details:
              <br />
              • 👤 Driver Name: {ride?.driver_name || 'N/A'}
              <br />
              • 📞 Driver Phone: {ride?.driver_phone || 'N/A'}
              <br />
              • 🚗 Vehicle Type: {ride?.vehicle_type ? ride.vehicle_type.toUpperCase() : 'N/A'}
              <br />
              • 🔢 Vehicle Plate: {ride?.vehicle_number || 'N/A'}
              <br />
              • 🔑 License Number: {ride?.license_number || 'N/A'}
              <br />
              • 📍 My Live Coordinates: {userCoords ? `${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)}` : (ride?.pickup_address || 'Unavailable')}
              <br />
              • 🔗 Live Tracking Link: http://localhost:3000/tracking/{rideId}
            </p>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1.25rem', textAlign: 'center' }}>
            In production, this message is sent via Twilio SMS gateway.
          </p>
          <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
            <Button variant="outline" onClick={() => setShowSmsModal(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
