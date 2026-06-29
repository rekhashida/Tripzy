import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiMapPin, FiUser, FiPhone, FiDollarSign } from 'react-icons/fi';
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
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [loading, setLoading] = useState(false);
  const [clickTarget, setClickTarget] = useState('pickup');
  const navigate = useNavigate();

  const create = async () => {
    if (!pickup.lat || !pickup.lng || !drop.lat || !drop.lng) {
      setMsg('Please select both pickup and drop locations.');
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
    <>
      <Card>
        <h1 className="card-title">
          <FiPackage style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Send a Parcel
        </h1>
        <p className="card-subtitle">Fast and secure parcel delivery with real-time tracking</p>

        {msg && (
          <div className={`alert alert-${msgType === 'success' ? 'success' : msgType === 'error' ? 'error' : 'info'}`}>
            {msg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label className="form-label">
              <FiMapPin style={{ marginRight: '0.5rem' }} />
              Pickup Location
            </label>
            <MapAutocomplete
              onPlaceSelected={(place) => setPickup(place)}
              onFocus={() => setClickTarget('pickup')}
              placeholder="Search pickup location..."
              value={pickup.address}
            />
            {pickup.lat && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Lat: {pickup.lat.toFixed(6)}, Lng: {pickup.lng.toFixed(6)}
              </div>
            )}
          </div>

          <div>
            <label className="form-label">
              <FiMapPin style={{ marginRight: '0.5rem' }} />
              Delivery Location
            </label>
            <MapAutocomplete
              onPlaceSelected={(place) => setDrop(place)}
              onFocus={() => setClickTarget('drop')}
              placeholder="Search delivery location..."
              value={drop.address}
            />
            {drop.lat && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Lat: {drop.lat.toFixed(6)}, Lng: {drop.lng.toFixed(6)}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <Map
            center={mapCenter}
            zoom={13}
            markers={markers}
            height={400}
            onMapClick={handleMapClick}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <Input
            label={
              <>
                <FiUser style={{ marginRight: '0.5rem' }} />
                Recipient Name
              </>
            }
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Enter recipient's name"
            required
          />

          <Input
            type="tel"
            label={
              <>
                <FiPhone style={{ marginRight: '0.5rem' }} />
                Recipient Phone
              </>
            }
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="Enter recipient's phone"
            required
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <Input
            type="number"
            label={
              <>
                <FiPackage style={{ marginRight: '0.5rem' }} />
                Weight (kg)
              </>
            }
            value={weightKg}
            onChange={(e) => setWeightKg(parseFloat(e.target.value) || 1)}
            min="0.1"
            step="0.1"
            placeholder="Enter parcel weight"
            required
          />
        </div>

        {fare && (
          <Card style={{ 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
            border: '1px solid var(--primary)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Estimated Fare</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                <FiDollarSign style={{ display: 'inline' }} /> ₹{fare}
              </div>
            </div>
          </Card>
        )}

        <Button
          variant="primary"
          onClick={create}
          disabled={loading || !pickup.lat || !drop.lat || !recipientName || !recipientPhone}
          className="w-full"
        >
          <FiPackage /> {loading ? 'Creating Parcel...' : 'Create Parcel Delivery'}
        </Button>
      </Card>
    </>
  );
}
