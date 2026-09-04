import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiPackage, FiMapPin, FiTruck, FiUser, FiPhone, FiDollarSign, FiClock, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import Map from '../components/Map';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Loading from '../components/Loading';
import Input from '../components/Input';

export default function ParcelTracking() {
  const { parcelId } = useParams();
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [otp, setOtp] = useState('');
  const [otpMsg, setOtpMsg] = useState('');
  const [courierLoc, setCourierLoc] = useState(null);
  const [animationIndex, setAnimationIndex] = useState(0);

  // Mock Courier Profile details
  const mockCourier = {
    name: 'Vikram Singh',
    phone: '+91 95959 59595',
    vehicle: 'Honda Activa (🛺 Courier)',
    plate: 'GJ-01-AB-1234',
    rating: '4.9'
  };

  useEffect(() => {
    loadParcel();
  }, [parcelId]);

  const loadParcel = async () => {
    try {
      const { data } = await api.get(`/parcels/${parcelId}`);
      setParcel(data);
      if (!courierLoc) {
        setCourierLoc({ lat: data.pickup_lat, lng: data.pickup_lng });
      }
    } catch (e) {
      setErr(e.response?.data?.error || 'Parcel not found');
    } finally {
      setLoading(false);
    }
  };

  // Courier location animation loop when status is 'picked_up'
  useEffect(() => {
    if (!parcel || parcel.status !== 'picked_up') return;

    // Generate 10 interpolation points between pickup and dropoff
    const steps = 100;
    const startLat = parcel.pickup_lat;
    const startLng = parcel.pickup_lng;
    const endLat = parcel.drop_lat;
    const endLng = parcel.drop_lng;

    const interval = setInterval(() => {
      setAnimationIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= steps) {
          clearInterval(interval);
          setCourierLoc({ lat: endLat, lng: endLng });
          return steps;
        }
        const lat = startLat + (endLat - startLat) * (nextIndex / steps);
        const lng = startLng + (endLng - startLng) * (nextIndex / steps);
        setCourierLoc({ lat, lng });
        return nextIndex;
      });
    }, 400); // Step every 400ms

    return () => clearInterval(interval);
  }, [parcel]);

  const handleVerifyOTP = async (type) => {
    if (!otp) {
      setOtpMsg('Please enter OTP');
      return;
    }
    setOtpMsg('');
    try {
      const endpoint = type === 'pickup'
        ? `/parcels/${parcelId}/verify-pickup`
        : `/parcels/${parcelId}/verify-drop`;
      
      const { data } = await api.post(endpoint, { otp });
      setOtpMsg(data.message || 'OTP verified successfully!');
      setOtp('');
      loadParcel();
    } catch (e) {
      setOtpMsg(e.response?.data?.error || 'Invalid OTP');
    }
  };

  if (loading) {
    return <Loading message="Loading parcel details..." />;
  }

  if (err) {
    return (
      <div style={{ maxWidth: '500px', margin: '3rem auto' }}>
        <Card>
          <div className="alert alert-error">{err}</div>
          <Link to="/my-parcels" style={{ display: 'block', marginTop: '1rem' }}>
            <Button variant="primary" className="w-full">Back to My Parcels</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const markers = [
    parcel.pickup_lat && parcel.pickup_lng
      ? { lat: parcel.pickup_lat, lng: parcel.pickup_lng, title: 'Pickup', label: 'P' }
      : null,
    parcel.drop_lat && parcel.drop_lng
      ? { lat: parcel.drop_lat, lng: parcel.drop_lng, title: 'Drop', label: 'D' }
      : null,
    courierLoc
      ? { lat: courierLoc.lat, lng: courierLoc.lng, title: 'Courier', label: 'C' }
      : null
  ].filter(Boolean);

  const path = [
    { lat: parcel.pickup_lat, lng: parcel.pickup_lng },
    { lat: parcel.drop_lat, lng: parcel.drop_lng }
  ];

  return (
    <div className="ride-booking-split-layout">
      {/* Left sidebar panel (40%) */}
      <div className="booking-panel-sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h1 className="card-title" style={{ margin: 0, fontSize: '1.25rem' }}>
            <FiPackage style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Parcel #{parcelId}
          </h1>
          <Badge status={parcel.status}>{parcel.status}</Badge>
        </div>

        {/* Progress Timeline Tracker */}
        <Card style={{ background: 'var(--bg-secondary)', marginBottom: '1.25rem', padding: '0.85rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
            📍 Delivery Progress Timeline
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: parcel.status === 'pending' ? 1 : 0.6 }}>
              <span style={{ color: parcel.status === 'pending' ? 'var(--primary)' : 'var(--success)' }}>
                {parcel.status !== 'pending' ? '✔️' : '🔴'}
              </span>
              <span><strong>Step 1:</strong> Waiting for Courier Pickup</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: parcel.status === 'picked_up' ? 1 : 0.6 }}>
              <span style={{ color: parcel.status === 'picked_up' ? 'var(--primary)' : parcel.status === 'delivered' ? 'var(--success)' : '⚪' }}>
                {parcel.status === 'delivered' ? '✔️' : parcel.status === 'picked_up' ? '🔴' : '⚪'}
              </span>
              <span><strong>Step 2:</strong> Package Picked Up (In Transit)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: parcel.status === 'delivered' ? 1 : 0.6 }}>
              <span style={{ color: parcel.status === 'delivered' ? 'var(--success)' : '⚪' }}>
                {parcel.status === 'delivered' ? '✔️' : '⚪'}
              </span>
              <span><strong>Step 3:</strong> Arrived at Destination & Delivered</span>
            </div>
          </div>
        </Card>

        {/* Mock Courier Info Card */}
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
              V
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{mockCourier.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{mockCourier.vehicle} • {mockCourier.plate}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>⭐ {mockCourier.rating} Rating</span>
            <span>• Verified Partner</span>
          </div>
        </Card>

        {/* Addresses & Multi-Stop Waypoints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
            <span style={{ color: 'var(--success)' }}>📍</span>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sender Pickup Address</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{parcel.pickup_address}</div>
            </div>
          </div>

          {parcel.stops && parcel.stops.length > 0 && parcel.stops.map((stop, idx) => (
            <div key={stop.id || idx} style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', paddingLeft: '1rem', borderLeft: '2px dashed var(--primary)' }}>
              <span style={{ color: 'var(--primary)' }}>📍</span>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Stop #{stop.stop_order} Waypoint ({stop.recipient_name})</div>
                <div style={{ fontSize: '0.825rem', fontWeight: 600 }}>{stop.address}</div>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
            <span style={{ color: 'var(--danger)' }}>🏁</span>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Final Recipient Drop Address</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{parcel.drop_address}</div>
            </div>
          </div>
        </div>

        {/* OTP Steps Simulation Dashboard */}
        <Card style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', marginBottom: '1.25rem', padding: '0.85rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary-light)', margin: '0 0 0.5rem 0' }}>
            🔒 Simulation Security OTPs
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Both sender and receiver must verify unique OTP codes to ensure delivery safety.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>🔑 Pickup OTP (Sender):</span>
              <strong style={{ color: 'var(--primary-light)' }}>{parcel.pickup_otp || 'N/A'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
              <span>🔑 Drop OTP (Receiver):</span>
              <strong style={{ color: 'var(--primary-light)' }}>{parcel.drop_otp || 'N/A'}</strong>
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '1rem 0', opacity: 0.3 }} />

          {/* Verification Actions */}
          {parcel.status === 'pending' && (
            <div>
              <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>Verify Pickup OTP (Start Delivery):</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Input
                  type="text"
                  placeholder="Enter 4-digit Pickup OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ flex: 1, padding: '0.4rem 0.6rem' }}
                />
                <Button variant="primary" onClick={() => handleVerifyOTP('pickup')}>Verify</Button>
              </div>
            </div>
          )}

          {parcel.status === 'picked_up' && (
            <div>
              <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>Verify Drop OTP (Mark Delivered):</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Input
                  type="text"
                  placeholder="Enter 4-digit Drop OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ flex: 1, padding: '0.4rem 0.6rem' }}
                />
                <Button variant="secondary" onClick={() => handleVerifyOTP('drop')}>Verify</Button>
              </div>
            </div>
          )}

          {parcel.status === 'delivered' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 700 }}>
              <FiCheckCircle /> Parcel successfully delivered!
            </div>
          )}

          {otpMsg && (
            <div className={`alert alert-${otpMsg.includes('Invalid') ? 'error' : 'success'}`} style={{ marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.5rem' }}>
              {otpMsg}
            </div>
          )}
        </Card>
      </div>

      {/* Right Map Canvas (60%) */}
      <div className="map-canvas-container">
        <Map
          center={{ lat: parcel.pickup_lat, lng: parcel.pickup_lng }}
          zoom={14}
          markers={markers}
          path={path}
          height="100%"
        />
      </div>
    </div>
  );
}
