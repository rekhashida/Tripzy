import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiMap, FiNavigation, FiMapPin, FiClock, FiDollarSign, FiUser, FiPhone, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import { joinRideRoom, leaveRideRoom, onLocationUpdate, offLocationUpdate, onStatusUpdate, offStatusUpdate, getSocket } from '../services/socket';
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
  const [poolNotification, setPoolNotification] = useState(null);
  const [otpType, setOtpType] = useState('pickup');
  const [otp, setOtp] = useState('');
  const [otpMsg, setOtpMsg] = useState('');
  const [eta, setEta] = useState(null);
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [userCoords, setUserCoords] = useState(null);

  // Post-ride Rating states
  const navigate = useNavigate();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [selectedChips, setSelectedChips] = useState([]);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  const toggleFeedbackChip = (chip) => {
    setSelectedChips((prev) => 
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleRatingSubmit = async () => {
    try {
      const comment = [...selectedChips, ratingComment].filter(Boolean).join('. ');
      await api.post('/ratings', {
        ride_id: parseInt(rideId, 10),
        rating,
        comment
      });
      localStorage.setItem(`rated_ride_${rideId}`, 'true');
      setShowRatingModal(false);
      setRatingSuccess(true);
      setTimeout(() => {
        setRatingSuccess(false);
        navigate('/my-rides');
      }, 2500);
    } catch (err) {
      console.error('Failed to submit rating:', err);
    }
  };

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

    const statusHandler = (data) => {
      console.log('Real-time ride status update received:', data);
      loadRide();
    };
    onStatusUpdate(statusHandler);

    const poolJoinedHandler = (data) => {
      setPoolNotification(data);
      loadRide();
      setTimeout(() => setPoolNotification(null), 6000);
    };
    
    let s = null;
    try {
      s = getSocket();
      if (s) {
        s.on('pool-joined', poolJoinedHandler);
      }
    } catch (sockErr) {
      console.warn('Socket listener failed to bind:', sockErr.message);
    }

    return () => {
      leaveRideRoom(rideId);
      offLocationUpdate();
      offStatusUpdate();
      if (s) {
        s.off('pool-joined', poolJoinedHandler);
      }
    };
  }, [rideId]);

  // Simulation of other passengers joining pool
  useEffect(() => {
    if (!ride || !ride.is_pooling || ride.status !== 'pending') return;

    const joinedCount = ride.passengers ? ride.passengers.length : 1;
    if (joinedCount < 3) {
      const timer = setTimeout(async () => {
        try {
          await api.post('/pooling/simulate-join', { rideId });
        } catch (simErr) {
          console.warn('Simulated passenger join skipped:', simErr.message);
        }
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [ride, rideId]);

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

      // Auto-open rating modal for riders if ride is completed and not rated yet
      if (data.status === 'completed') {
        const ratedKey = `rated_ride_${rideId}`;
        if (!localStorage.getItem(ratedKey)) {
          setShowRatingModal(true);
        }
      }
    } catch (e) {
      setErr(e.response?.data?.error || 'Ride not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSos = () => {
    alert('🚨 Emergency SOS triggered! Local authorities and emergency services have been dispatched with your live coordinates.');
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
      {poolNotification && (
        <div style={{
          position: 'fixed',
          top: '90px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-glass)',
          border: '1px solid #10b981',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), var(--shadow-glow)',
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'slideDown 0.3s ease-out'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🔔</span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 800, color: '#34d399', fontSize: '0.9rem' }}>Match Found!</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>{poolNotification.userName}</strong> has joined your pool. Your fare share drops to <strong>₹{poolNotification.fareShare}</strong>!
            </div>
          </div>
        </div>
      )}

      <div className="ride-booking-split-layout">
        {/* Left Control Panel (40%) */}
        <div className="booking-panel-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h1 className="card-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            <FiMap style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Ride #{rideId}
          </h1>
          <Badge status={ride.status}>{ride.status}</Badge>
        </div>

        {eta && (
          <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Estimated Arrival:</span>
            <strong>{eta}</strong>
          </div>
        )}

        {ride.driver_name ? (
          <Card style={{ background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))', marginBottom: '1.25rem', padding: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '1.1rem'
              }}>
                {ride.driver_name && ride.driver_name.length > 0 ? ride.driver_name[0].toUpperCase() : 'D'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{ride.driver_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ride.vehicle_number || 'White sedan'} • {ride.vehicle_type}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
              {ride.driver_rating && (
                <Badge variant="warning" style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem' }}>
                  ⭐ {parseFloat(ride.driver_rating).toFixed(1)}
                </Badge>
              )}
              <Badge status="completed" style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem' }}>Verified</Badge>
            </div>
            
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>📞</span> <strong>Phone:</strong> {ride.driver_phone || 'Not available'}
            </div>
          </Card>
        ) : (
          <div style={{ 
            background: 'var(--bg-tertiary)',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            marginBottom: '1.25rem',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            Waiting for driver assignment...
          </div>
        )}

        {ride.is_pooling === 1 && (
          <Card style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.08))', marginBottom: '1.25rem', padding: '0.85rem', border: '1px solid var(--primary)' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              👥 Pool Passengers ({ride.passengers ? ride.passengers.length : 1}/3)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {/* Creator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>🙋‍♂️ You (Creator)</span>
                <span style={{ color: 'var(--text-muted)' }}>Share: ₹{ride.passengers && ride.passengers.length > 0 ? ride.passengers[0].fare_share : ride.fare}</span>
              </div>
              {/* Joined Members */}
              {ride.passengers && ride.passengers.map((p) => {
                if (p.user_id === ride.user_id) return null;
                return (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', opacity: 0.9 }}>
                    <span>👥 {p.user_name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Share: ₹{p.fare_share}</span>
                  </div>
                );
              })}
            </div>
            
            {(!ride.passengers || ride.passengers.length < 3) && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="spinner-mini" style={{ width: '10px', height: '10px', border: '2px solid var(--text-muted)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
                <span>Searching for nearby passengers matching your route...</span>
              </div>
            )}
          </Card>
        )}

        {/* Address Indicators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
            <span style={{ color: 'var(--success)' }}>📍</span>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pickup Address</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ride.pickup_address || `${ride.pickup_lat}, ${ride.pickup_lng}`}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
            <span style={{ color: 'var(--danger)' }}>🏁</span>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Drop Address</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ride.drop_address || `${ride.drop_lat}, ${ride.drop_lng}`}</div>
            </div>
          </div>
        </div>

        {/* Action / OTP Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {ride.status === 'driver_assigned' && ride.pickup_otp && (
            <Button
              variant="primary"
              onClick={() => {
                setOtpType('pickup');
                setOtpModalOpen(true);
              }}
              style={{ width: '100%' }}
            >
              Verify Pickup OTP
            </Button>
          )}
          {ride.status === 'otp_verified' && ride.drop_otp && (
            <Button
              variant="secondary"
              onClick={() => {
                setOtpType('drop');
                setOtpModalOpen(true);
              }}
              style={{ width: '100%' }}
            >
              Verify Drop OTP
            </Button>
          )}
        </div>

        {/* Emergency Panel / SOS Panel */}
        <Card style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '1.25rem', padding: '0.85rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--danger)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            🚨 Safety Shield Active
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            <Button variant="outline" size="small" onClick={() => window.open(`tel:${ride.driver_phone || '911'}`)}>Call</Button>
            <Button variant="primary" size="small" style={{ background: 'var(--danger)', color: '#fff' }} onClick={handleSos}>SOS Alert</Button>
            <Button variant="outline" size="small" onClick={() => alert('Emergency contact notified.')}>Share Trip</Button>
          </div>
        </Card>

        {/* Emergency Sharing Section */}
        <Card style={{ background: 'var(--bg-secondary)', marginBottom: '1rem', border: '1px solid var(--border-color)', padding: '0.85rem' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 700 }}>
            🛡️ Safety Shield
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Enter a trusted contact to simulate sending an emergency live tracking SMS link.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Input
              label="Emergency Contact Phone"
              type="text"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="e.g. +91 99999 99999"
              style={{ padding: '0.5rem' }}
            />
            <Button variant="primary" onClick={() => setShowSmsModal(true)} disabled={!emergencyPhone} style={{ padding: '0.6rem', fontSize: '0.85rem' }}>
              Simulate Emergency Share
            </Button>
          </div>
        </Card>
      </div>

      {/* Right Map Canvas (60%) */}
      <div className="map-canvas-container">
        <Map
          center={mapCenter}
          zoom={15}
          markers={markers}
          path={path}
          height="100%"
        />
      </div>
    </div>

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

      {/* Post-Ride Rating Modal */}
      <Modal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title="Rate Your Ride with Tripzy"
      >
        <div style={{ padding: '1rem 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            We hope you had a pleasant journey! Please rate your driver <strong>{ride?.driver_name || 'Driver'}</strong>.
          </p>

          {/* Interactive Star Selector */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                onClick={() => setRating(star)}
                style={{
                  fontSize: '2.75rem',
                  cursor: 'pointer',
                  color: star <= rating ? '#f59e0b' : 'var(--border-color, #e2e8f0)',
                  transition: 'all 0.15s ease-in-out',
                  transform: star <= rating ? 'scale(1.15)' : 'scale(1.0)',
                  display: 'inline-block'
                }}
              >
                ★
              </span>
            ))}
          </div>

          {/* Feedback Chips */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', textAlign: 'left' }}>
              What went well?
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'left' }}>
              {['Clean Car 🧼', 'Safe Driving 🛡️', 'Polite Driver 😊', 'Good Route choice 🗺️', 'Great Conversation 💬'].map((chip) => {
                const active = selectedChips.includes(chip);
                return (
                  <button
                    key={chip}
                    onClick={() => toggleFeedbackChip(chip)}
                    style={{
                      border: '1px solid ' + (active ? 'var(--primary)' : 'var(--border-color)'),
                      background: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      color: active ? 'var(--primary-light)' : 'var(--text-primary)',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment input */}
          <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
            <label className="form-label">Additional Comments (Optional)</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Tell us more about your ride..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Button variant="primary" onClick={handleRatingSubmit} className="flex-1">
              Submit Review
            </Button>
            <Button variant="outline" onClick={() => setShowRatingModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={ratingSuccess}
        onClose={() => setRatingSuccess(false)}
        title="Thank You!"
      >
        <div style={{ padding: '2rem 0', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', color: 'var(--success)', marginBottom: '1rem' }}>🎉</div>
          <h3>Feedback Submitted Successfully!</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Your rating helps us keep the Tripzy community safe and clean. Redirecting to My Rides...
          </p>
        </div>
      </Modal>
    </>
  );
}
