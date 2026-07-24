import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiMapPin, FiUser, FiPhone, FiDollarSign, FiZap } from 'react-icons/fi';
import api from '../services/api';
import Map, { MapAutocomplete } from '../components/Map';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

export default function ParcelDelivery() {
  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null });
  const [drop, setDrop] = useState({ address: '', lat: null, lng: null });
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [weightKg, setWeightKg] = useState(1);
  const [fare, setFare] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [surgeInfo, setSurgeInfo] = useState(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [loading, setLoading] = useState(false);
  const [clickTarget, setClickTarget] = useState('pickup');
  const navigate = useNavigate();

  const estimate = async () => {
    if (!pickup.lat || !pickup.lng || !drop.lat || !drop.lng) {
      setMsg('Please select both pickup and delivery locations on the map or using search.');
      setMsgType('error');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const { data } = await api.post('/parcels/estimate', {
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        weight_kg: weightKg
      });
      setFare(data.fare);
      setDistance(data.distanceKm);
      setDuration(data.durationMin);
      setSurgeInfo(data.breakdown);
      setMsg(`Estimated fare: ₹${data.fare} | Distance: ${data.distanceKm} km | Duration: ~${data.durationMin} min`);
      setMsgType('success');
    } catch (e) {
      setMsg(e.response?.data?.error || 'Failed to estimate fare. Please try again.');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    if (!pickup.lat || !pickup.lng || !drop.lat || !drop.lng) {
      setMsg('Please select both pickup and delivery locations.');
      setMsgType('error');
      return;
    }
    if (!recipientName || !recipientPhone) {
      setMsg('Please fill in recipient details.');
      setMsgType('error');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const { data } = await api.post('/parcels', {
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        pickup_address: pickup.address,
        drop_address: drop.address,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        weight_kg: weightKg
      });
      setFare(data.fare);
      setMsg(`Parcel created successfully! ID: ${data.parcelId}. Fare: ₹${data.fare}. Pickup OTP: ${data.pickup_otp}, Drop OTP: ${data.drop_otp}`);
      setMsgType('success');
      setTimeout(() => {
        navigate('/my-parcels');
      }, 3000);
    } catch (e) {
      setMsg(e.response?.data?.error || 'Failed to create parcel. Please try again.');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const getAiDeliveryInsight = () => {
    if (weightKg > 8) {
      return {
        text: `🤖 AI Parcel Insight: Heavy load detected (${weightKg} kg). We recommend selecting secure packing with double-walled boxes. Drivers are warned about fragile handling.`
      };
    } else if (surgeInfo?.surge > 1) {
      return {
        text: `🤖 AI Parcel Insight: Courier demand is currently high in your delivery zone. Booking now guarantees instant driver matching, preventing delivery delays.`
      };
    } else {
      return {
        text: `🤖 AI Parcel Insight: Courier traffic is smooth. Standard delivery times apply. Package will arrive at the recipient location within approx. ${duration || 25} minutes.`
      };
    }
  };

  const handleMapClick = async (e) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        if (res.ok) {
          const data = await res.json();
          const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          if (clickTarget === 'pickup') {
            setPickup({ address, lat, lng });
          } else {
            setDrop({ address, lat, lng });
          }
        }
      } catch (err) {
        console.error('Reverse geocode error:', err);
        const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        if (clickTarget === 'pickup') {
          setPickup({ address, lat, lng });
        } else {
          setDrop({ address, lat, lng });
        }
      }
    }
  };

  const markers = [
    pickup.lat && pickup.lng ? { lat: pickup.lat, lng: pickup.lng, title: 'Pickup', label: 'P' } : null,
    drop.lat && drop.lng ? { lat: drop.lat, lng: drop.lng, title: 'Drop', label: 'D' } : null,
  ].filter(Boolean);

  const mapCenter = pickup.lat && pickup.lng 
    ? { lat: pickup.lat, lng: pickup.lng }
    : { lat: 23.0225, lng: 72.5714 };

  return (
    <div className="ride-booking-split-layout">
      {/* Left Sidebar Control Panel (40%) */}
      <div className="booking-panel-sidebar">
        <h1 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
          <FiPackage style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Send a Parcel
        </h1>
        <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>Fast and secure parcel delivery with real-time tracking</p>

        {msg && (
          <div className={`alert alert-${msgType === 'success' ? 'success' : msgType === 'error' ? 'error' : 'info'}`} style={{ marginBottom: '1.25rem' }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>
              <FiMapPin style={{ marginRight: '0.35rem' }} />
              Pickup Location
            </label>
            <MapAutocomplete
              onPlaceSelected={(place) => setPickup(place)}
              onFocus={() => setClickTarget('pickup')}
              placeholder="Search pickup location..."
              value={pickup.address}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: '0.85rem' }}>
              <FiMapPin style={{ marginRight: '0.35rem' }} />
              Delivery Location
            </label>
            <MapAutocomplete
              onPlaceSelected={(place) => setDrop(place)}
              onFocus={() => setClickTarget('drop')}
              placeholder="Search delivery location..."
              value={drop.address}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label={
                <>
                  <FiUser style={{ marginRight: '0.35rem' }} />
                  Recipient Name
                </>
              }
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Recipient's name"
              required
            />
            <Input
              type="tel"
              label={
                <>
                  <FiPhone style={{ marginRight: '0.35rem' }} />
                  Recipient Phone
                </>
              }
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Recipient's phone"
              required
            />
          </div>

          <div>
            <Input
              type="number"
              label={
                <>
                  <FiPackage style={{ marginRight: '0.35rem' }} />
                  Weight (kg)
                </>
              }
              value={weightKg}
              onChange={(e) => setWeightKg(parseFloat(e.target.value) || 1)}
              min="0.1"
              step="0.1"
              placeholder="Weight in kg"
              required
            />
          </div>
        </div>

        {!fare ? (
          <Button
            variant="primary"
            onClick={estimate}
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {loading ? 'Estimating...' : 'Estimate Delivery'}
          </Button>
        ) : (
          <>
            {surgeInfo && surgeInfo.surge > 1 && (
              <div className="surge-active-indicator">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    🔥 SURGE PRICING ACTIVE
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {surgeInfo.isLateNight ? 'Late Night Demand' : 'Peak Hour Rush'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '0.25rem', textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Surge: {Math.round((surgeInfo.surge - 1) * 100)}%
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444' }}>
                    Base: ₹{Math.round(surgeInfo.base)} → ₹{surgeInfo.final}
                  </div>
                </div>
              </div>
            )}

            <div className="ai-insight-card">
              <div className="ai-insight-badge">🤖 AI Insight</div>
              <div className="ai-insight-text">
                {getAiDeliveryInsight().text}
              </div>
            </div>

            <Card style={{ 
              background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))',
              border: '1px solid var(--border-color)',
              marginBottom: '1rem',
              padding: '0.75rem',
              marginTop: '0.5rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Delivery Charge</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>₹{fare}</span>
                </div>
                {distance && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Distance</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{distance} km</span>
                  </div>
                )}
                {duration && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Duration</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{duration} min</span>
                  </div>
                )}
              </div>
            </Card>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Button
                variant="primary"
                onClick={create}
                disabled={loading}
                style={{ flex: 2, padding: '0.75rem' }}
              >
                {loading ? 'Creating...' : 'Send Package'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFare(null);
                  setPickup({ address: '', lat: null, lng: null });
                  setDrop({ address: '', lat: null, lng: null });
                }}
                disabled={loading}
                style={{ flex: 1, padding: '0.75rem' }}
              >
                Reset
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Right Map Canvas (60%) */}
      <div className="map-canvas-container">
        <Map
          center={mapCenter}
          zoom={13}
          markers={markers}
          height="100%"
          onMapClick={handleMapClick}
        />
      </div>
    </div>
  );
}
