import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiNavigation, FiMapPin, FiDollarSign, FiClock, FiTruck, FiPackage } from 'react-icons/fi';
import api from '../services/api';
import Map, { MapAutocomplete } from '../components/Map';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

const VEHICLE_MULTIPLIERS = {
  bike: 0.6,
  auto: 0.8,
  hatchback: 0.9,
  sedan: 1.0,
  suv: 1.3,
};

const vehicleOptions = [
  { type: 'bike', label: 'Bike', icon: '🏍️', desc: 'Quick single rider trip', capacity: 1 },
  { type: 'auto', label: 'Auto Rickshaw', icon: '🛺', desc: 'Zip through city traffic', capacity: 3 },
  { type: 'hatchback', label: 'Hatchback', icon: '🚗', desc: 'Affordable daily commutes', capacity: 4 },
  { type: 'sedan', label: 'Sedan', icon: '🚘', desc: 'Comfortable spacious sedan', capacity: 4 },
  { type: 'suv', label: 'SUV', icon: '🚙', desc: 'Premium rides for groups', capacity: 6 },
];

export default function RideBooking() {
  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null });
  const [drop, setDrop] = useState({ address: '', lat: null, lng: null });
  const [vehicleType, setVehicleType] = useState('sedan');
  const [estimatedVehicle, setEstimatedVehicle] = useState('sedan');
  const [luggageSize, setLuggageSize] = useState('medium');
  const [vehicleSuggestions, setVehicleSuggestions] = useState([]);
  const [fare, setFare] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [rideOtp, setRideOtp] = useState({ rideId: null, pickup_otp: null, drop_otp: null });
  const [surgeInfo, setSurgeInfo] = useState(null);
  const [clickTarget, setClickTarget] = useState('pickup');
  const navigate = useNavigate();

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
        luggage_size: luggageSize
      });
      setFare(data.fare);
      setEstimatedVehicle(vehicleType);
      setDistance(data.distanceKm);
      setDuration(data.durationMin);
      setSurgeInfo(data.breakdown);
      setVehicleSuggestions(data.suggestions || []);
      setMsg(`Estimated fare: ₹${data.fare} | Distance: ${data.distanceKm} km | Duration: ~${data.durationMin} min`);
      setMsgType('success');
    } catch (e) {
      setMsg(e.response?.data?.error || 'Failed to estimate fare. Please try again.');
      setMsgType('error');
    }
    setLoading(false);
  };

  const getVehicleFare = (type) => {
    if (!fare || !estimatedVehicle) return null;
    const baseSedan = fare / VEHICLE_MULTIPLIERS[estimatedVehicle];
    return Math.round(baseSedan * VEHICLE_MULTIPLIERS[type]);
  };

  const book = async () => {
    if (!pickup.lat || !pickup.lng || !drop.lat || !drop.lng) {
      setMsg('Please select both pickup and drop locations.');
      setMsgType('error');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const { data } = await api.post('/rides', {
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        drop_lat: drop.lat,
        drop_lng: drop.lng,
        pickup_address: pickup.address,
        drop_address: drop.address,
        vehicle_type: vehicleType,
        luggage_size: luggageSize,
        is_pooling: false
      });
      setRideOtp({
        rideId: data.rideId,
        pickup_otp: data.pickup_otp,
        drop_otp: data.drop_otp
      });
      setShowOtpModal(true);
      setMsg(`Ride booked successfully! Ride ID: ${data.rideId}`);
      setMsgType('success');
    } catch (e) {
      setMsg(e.response?.data?.error || 'Booking failed. Please try again.');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const getAiPriceInsight = () => {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const timeInHours = hour + minutes / 60;

    const morningPeakStart = 8.5;
    const morningPeakEnd = 10.0;
    const eveningPeakStart = 18.0;
    const eveningPeakEnd = 20.5;

    const isMorningPeak = timeInHours >= morningPeakStart && timeInHours <= morningPeakEnd;
    const isEveningPeak = timeInHours >= eveningPeakStart && timeInHours <= eveningPeakEnd;
    const isPeakActive = isMorningPeak || isEveningPeak;

    if (isPeakActive) {
      let remainingMin = 0;
      if (isMorningPeak) {
        remainingMin = Math.round((morningPeakEnd - timeInHours) * 60);
      } else {
        remainingMin = Math.round((eveningPeakEnd - timeInHours) * 60);
      }
      return {
        isPeak: true,
        text: `🔥 AI Price Insight: Fares are currently 1.5x higher due to Peak Hours. Demand is expected to return to normal in approximately ${remainingMin} minutes. If your travel is not urgent, consider waiting to save on fare!`
      };
    } else {
      let nextPeakMsg = '';
      if (timeInHours < morningPeakStart) {
        const diffMin = Math.round((morningPeakStart - timeInHours) * 60);
        nextPeakMsg = `Morning Peak starts in ${diffMin} minutes (8:30 AM)`;
      } else if (timeInHours < eveningPeakStart) {
        const diffMin = Math.round((eveningPeakStart - timeInHours) * 60);
        nextPeakMsg = `Evening Peak starts in ${diffMin} minutes (6:00 PM)`;
      } else {
        nextPeakMsg = `Morning Peak starts at 8:30 AM tomorrow`;
      }
      return {
        isPeak: false,
        text: `💡 AI Price Insight: Demand is currently low. Book your ride now to take advantage of standard fares before the next surge (${nextPeakMsg})!`
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
    <>
      <div className="ride-booking-split-layout">
        {/* Left Control Panel (40%) */}
        <div className="booking-panel-sidebar">
        <h1 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
          <FiNavigation style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Book a Ride
        </h1>
        <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>Select your locations and details</p>

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
              label={
                <>
                  <FiPackage style={{ marginRight: '0.35rem' }} />
                  Luggage Size
                </>
              }
              value={luggageSize}
              onChange={(e) => setLuggageSize(e.target.value)}
              options={[
                { value: 'small', label: 'Small' },
                { value: 'medium', label: 'Medium' },
                { value: 'large', label: 'Large' }
              ]}
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
            {loading ? 'Estimating...' : 'Estimate Fare'}
          </Button>
        ) : (
          <>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              Select Vehicle Option
            </div>
            <div className="vehicle-selector-list-horizontal">
              {vehicleOptions.map((v) => {
                const estPrice = getVehicleFare(v.type);
                const isSelected = vehicleType === v.type;
                return (
                  <div
                    key={v.type}
                    className={`vehicle-card-horizontal ${isSelected ? 'active' : ''}`}
                    onClick={() => setVehicleType(v.type)}
                  >
                    <span className="vehicle-card-horizontal-icon">{v.icon}</span>
                    <div className="vehicle-card-horizontal-title">{v.label}</div>
                    {estPrice && <div className="vehicle-card-horizontal-price">₹{estPrice}</div>}
                    <button 
                      className="vehicle-card-horizontal-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVehicleType(v.type);
                      }}
                      style={{
                        background: isSelected ? 'var(--primary)' : 'var(--secondary)',
                        boxShadow: isSelected ? 'var(--shadow-glow)' : 'none'
                      }}
                    >
                      Book
                    </button>
                  </div>
                );
              })}
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
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated Fare</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>₹{getVehicleFare(vehicleType)}</span>
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
                onClick={book}
                disabled={loading}
                style={{ flex: 2, padding: '0.75rem' }}
              >
                {loading ? 'Booking...' : 'Book Ride'}
              </Button>
              <Button
                variant="outline"
                onClick={estimate}
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

      <Modal
        isOpen={showOtpModal}
        onClose={() => {
          setShowOtpModal(false);
          setTimeout(() => {
            navigate(`/tracking/${rideOtp.rideId}`);
          }, 500);
        }}
        title="Ride Booked Successfully! 🎉"
      >
        <div className="modal-body" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Your Ride ID
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
              {rideOtp.rideId}
            </div>
          </div>

          <div style={{ 
            background: 'var(--bg-tertiary)',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            marginBottom: '1.25rem',
            border: '2px solid var(--primary)'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pickup OTP
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.2em' }}>
              {rideOtp.pickup_otp}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Share this code with your driver
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setShowOtpModal(false);
              setTimeout(() => {
                navigate(`/tracking/${rideOtp.rideId}`);
              }, 500);
            }}
            style={{ width: '100%' }}
          >
            <FiNavigation /> Track Your Ride
          </Button>
        </div>
      </Modal>
    </div>
    </>
  );
}
