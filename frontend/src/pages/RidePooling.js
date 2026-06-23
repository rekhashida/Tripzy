import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiMapPin, FiDollarSign, FiUser, FiNavigation } from 'react-icons/fi';
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
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [loading, setLoading] = useState(false);
  const [loadingPools, setLoadingPools] = useState(true);
  const navigate = useNavigate();

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

  const markers = [
    pickup.lat && pickup.lng ? { lat: pickup.lat, lng: pickup.lng, title: 'Pickup', label: 'P' } : null,
    drop.lat && drop.lng ? { lat: drop.lat, lng: drop.lng, title: 'Drop', label: 'D' } : null,
  ].filter(Boolean);

  const mapCenter = pickup.lat && pickup.lng 
    ? { lat: pickup.lat, lng: pickup.lng }
    : { lat: 23.0225, lng: 72.5714 };

  return (
    <>
      <Card>
        <h1 className="card-title">
          <FiUsers style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Ride Pooling
        </h1>
        <p className="card-subtitle">Share rides and save money while reducing your carbon footprint</p>

        {msg && (
          <div className={`alert alert-${msgType === 'success' ? 'success' : msgType === 'error' ? 'error' : 'info'}`}>
            {msg}
          </div>
        )}

        <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: 600 }}>Create a Pool Ride</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label className="form-label">
              <FiMapPin style={{ marginRight: '0.5rem' }} />
              Pickup Location
            </label>
            <MapAutocomplete
              onPlaceSelected={(place) => setPickup(place)}
              placeholder="Search pickup location..."
            />
          </div>

          <div>
            <label className="form-label">
              <FiMapPin style={{ marginRight: '0.5rem' }} />
              Drop Location
            </label>
            <MapAutocomplete
              onPlaceSelected={(place) => setDrop(place)}
              placeholder="Search drop location..."
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <Map
            center={mapCenter}
            zoom={13}
            markers={markers}
            height={300}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
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

        <Button
          variant="primary"
          onClick={createPool}
          disabled={loading || !pickup.lat || !drop.lat}
          className="w-full"
        >
          <FiUsers /> {loading ? 'Creating Pool...' : 'Create Pool Ride'}
        </Button>
      </Card>

      <Card>
        <h2 className="card-title">
          <FiUsers style={{ marginRight: '0.5rem' }} />
          Available Pool Rides
        </h2>
        <p className="card-subtitle">Join an existing pool ride to share the cost</p>

        {loadingPools ? (
          <Loading message="Loading available pools..." />
        ) : pools.length === 0 ? (
          <div className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
            <FiUsers style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }} />
            <p>No available pool rides at the moment. Create one above!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pools.map((pool) => (
              <div key={pool.id} className="list-item">
                <div className="list-item-content">
                  <div className="list-item-title">
                    {pool.pickup_address || 'Pickup'} → {pool.drop_address || 'Drop'}
                  </div>
                  <div className="list-item-subtitle" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <span>
                      <FiDollarSign style={{ display: 'inline', marginRight: '0.25rem' }} />
                      ₹{pool.fare} total
                    </span>
                    <span>
                      <FiUser style={{ display: 'inline', marginRight: '0.25rem' }} />
                      {pool.passengers || 1} passenger(s)
                    </span>
                    {pool.vehicle_type && (
                      <Badge status="in_progress">{pool.vehicle_type}</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => joinPool(pool.id)}
                  disabled={loading}
                >
                  <FiUsers /> Join Pool
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
