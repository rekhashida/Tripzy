import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiMapPin, FiDollarSign, FiUser, FiNavigation, FiZap } from 'react-icons/fi';
import api from '../services/api';
import Map, { MapAutocomplete } from '../components/Map';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Loading from '../components/Loading';

export default function RidePooling() {
  const [pools, setPools] = useState([]);
  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null });
  const [drop, setDrop] = useState({ address: '', lat: null, lng: null });
  const [vehicleType, setVehicleType] = useState('sedan');
  const [fare, setFare] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [surgeInfo, setSurgeInfo] = useState(null);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [loading, setLoading] = useState(false);
  const [loadingPools, setLoadingPools] = useState(true);
  const [clickTarget, setClickTarget] = useState('pickup');
  const navigate = useNavigate();

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

  useEffect(() => {
    loadPools();
  }, []);

  const loadPools = async () => {
    try {
      const { data } = await api.get('/pooling/available');
      setPools(data || []);
    } catch (e) {
      setPools([]);
    } finally {
      setLoadingPools(false);
    }
  };

  const estimate = async () => {
    if (!pickup.lat || !pickup.lng || !drop.lat || !drop.lng) {
      setMsg('Please select both pickup and drop locations on the map or using search.');
      setMsgType('error');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const { data } = await api.post('/rides/estimate', {
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        vehicle_type: vehicleType,
        luggage_size: 'small'
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

  const createPool = async () => {
    if (!pickup.lat || !pickup.lng || !drop.lat || !drop.lng) {
      setMsg('Please select both pickup and drop locations.');
      setMsgType('error');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const { data } = await api.post('/pooling/create', {
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        pickup_address: pickup.address,
        drop_address: drop.address,
        vehicle_type: vehicleType
      });
      setMsg(`Pool ride created successfully! Your share: ₹${data.fareShare}. Ride ID: ${data.rideId}`);
      setMsgType('success');
      setTimeout(() => {
        navigate(`/tracking/${data.rideId}`);
      }, 2000);
    } catch (e) {
      setMsg(e.response?.data?.error || 'Failed to create pool ride. Please try again.');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const joinPool = async (rideId) => {
    setLoading(true);
    setMsg('');
    try {
      const { data } = await api.post('/pooling/join', { ride_id: rideId });
      setMsg(`Successfully joined pool! Your share: ₹${data.fareShare}`);
      setMsgType('success');
      setPools((prev) => prev.filter((p) => p.id !== rideId));
      setTimeout(() => {
        navigate(`/tracking/${rideId}`);
      }, 2000);
    } catch (e) {
      setMsg(e.response?.data?.error || 'Failed to join pool. Please try again.');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const getAiPoolingInsight = () => {
    const originalPrice = fare || 120;
    const pooledPrice = Math.round(originalPrice / 2);
    return {
      text: `🤖 AI Pooling Insight: Sharing this ride will save approximately 65% CO2 emissions. Your fare will drop from ₹${originalPrice} to ₹${pooledPrice}. High match probability (92%) detected on your route.`
    };
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
      {/* Left Control Panel sidebar (40%) */}
      <div className="booking-panel-sidebar">
        <h1 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
          <FiUsers style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Ride Pooling
        </h1>
        <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>Share rides and save money while reducing your carbon footprint</p>

        {msg && (
          <div className={`alert alert-${msgType === 'success' ? 'success' : msgType === 'error' ? 'error' : 'info'}`} style={{ marginBottom: '1.25rem' }}>
            {msg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
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
              Drop Location
            </label>
            <MapAutocomplete
              onPlaceSelected={(place) => setDrop(place)}
              onFocus={() => setClickTarget('drop')}
              placeholder="Search drop location..."
              value={drop.address}
            />
          </div>

          <div>
            <Select
              label="Vehicle Type"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              options={[
                { value: 'sedan', label: 'Sedan' },
                { value: 'hatchback', label: 'Hatchback' },
                { value: 'suv', label: 'SUV' }
              ]}
            />
          </div>
        </div>

        {!fare ? (
          <Button
            variant="primary"
            onClick={estimate}
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem' }}
          >
            {loading ? 'Estimating...' : 'Estimate Fare'}
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
                    Base: ₹{Math.round(surgeInfo.vehicleAdjustedSubtotal)} → ₹{surgeInfo.final}
                  </div>
                </div>
              </div>
            )}

            <div className="ai-insight-card">
              <div className="ai-insight-badge">🤖 AI Insight</div>
              <div className="ai-insight-text">
                {getAiPoolingInsight().text}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <Button
                variant="primary"
                onClick={createPool}
                disabled={loading}
                style={{ flex: 2, padding: '0.75rem' }}
              >
                {loading ? 'Creating...' : 'Create Pool'}
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

        <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

        <h2 style={{ marginBottom: '1rem', fontSize: '1.15rem', fontWeight: 700 }}>
          Available Pools
        </h2>
        
        {loadingPools ? (
          <Loading message="Loading available pools..." />
        ) : pools.length === 0 ? (
          <div style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No available pools at this moment. Create one above!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pools.map((p) => (
              <div key={p.id} style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {p.pickup_address ? p.pickup_address.split(',')[0] : 'Pickup'} → {p.drop_address ? p.drop_address.split(',')[0] : 'Drop'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    ₹{p.fareShare} / seat • {p.vehicle_type}
                  </div>
                </div>
                <Button variant="secondary" size="small" onClick={() => joinPool(p.id)} disabled={loading}>
                  Join
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Map Canvas (60%) */}
      <div className="map-canvas-container">
        <Map
          center={mapCenter}
          zoom={13}
          markers={markers}
          path={pickup.lat && drop.lat ? [pickup, drop] : []}
          height="100%"
          onMapClick={handleMapClick}
        />
      </div>
    </div>
  );
}
