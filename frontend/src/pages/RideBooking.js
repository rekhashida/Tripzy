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

export default function RideBooking() {
  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null });
  const [drop, setDrop] = useState({ address: '', lat: null, lng: null });
  const [vehicleType, setVehicleType] = useState('sedan');
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

  const handleMapClick = (e) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      // You can reverse geocode here to get address
      if (!pickup.lat || !pickup.lng) {
        setPickup({ ...pickup, lat, lng });
      } else if (!drop.lat || !drop.lng) {
        setDrop({ ...drop, lat, lng });
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
          <FiNavigation style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Book a Ride
        </h1>
        <p className="card-subtitle">Select your pickup and drop locations to get started</p>

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
              placeholder="Search pickup location..."
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
              Drop Location
            </label>
            <MapAutocomplete
              onPlaceSelected={(place) => setDrop(place)}
              placeholder="Search drop location..."
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
          <Select
            label={
              <>
                <FiTruck style={{ marginRight: '0.5rem' }} />
                Vehicle Type
              </>
            }
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            options={[
              { value: 'hatchback', label: 'Hatchback' },
              { value: 'sedan', label: 'Sedan' },
              { value: 'suv', label: 'SUV' },
              { value: 'auto', label: 'Auto Rickshaw' },
              { value: 'bike', label: 'Bike' }
            ]}
          />

          <Select
            label={
              <>
                <FiPackage style={{ marginRight: '0.5rem' }} />
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

        {vehicleSuggestions && vehicleSuggestions.length > 0 && (
          <Card style={{ marginBottom: '1rem', padding: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Recommended Vehicles</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Based on your luggage selection</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {vehicleSuggestions.map((v) => (
                  <Button
                    key={v}
                    variant={vehicleType === v ? 'primary' : 'outline'}
                    onClick={() => setVehicleType(v)}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {v === 'auto' ? 'Auto' : v}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {fare && (
          <>
            <Card style={{ 
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
              border: '1px solid var(--primary)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Fare</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                    <FiDollarSign style={{ display: 'inline' }} /> ₹{fare}
                  </div>
                </div>
                {distance && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Distance</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{distance} km</div>
                  </div>
                )}
                {duration && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Duration</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
                      <FiClock style={{ display: 'inline', marginRight: '0.25rem' }} />
                      {duration} min
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card style={{
              background: 'var(--bg-tertiary)',
              border: '1px dashed var(--border-color)',
              marginBottom: '1.5rem',
              padding: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🧠</span>
                <div style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-muted)' }}>
                  {getAiPriceInsight().text}
                </div>
              </div>
            </Card>

            {surgeInfo && surgeInfo.surge > 1 && (
              <Card style={{ 
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(249, 115, 22, 0.15))',
                border: '2px solid rgba(239, 68, 68, 0.5)',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(239, 68, 68, 0.9)', marginBottom: '0.3rem' }}>
                      🔥 SURGE PRICING ACTIVE
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {surgeInfo.isPeakHour && 'Peak Hours Detected'}
                      {surgeInfo.isLateNight && 'Late Night Demand'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Surge: {(surgeInfo.surge * 100 - 100).toFixed(0)}%</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'rgba(239, 68, 68, 0.9)' }}>
                      Base: ₹{surgeInfo.subtotal} → ₹{fare}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {surgeInfo && surgeInfo.luggageMultiplier > 1.0 && (
              <Card style={{ 
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15))',
                border: '2px solid rgba(59, 130, 246, 0.5)',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(59, 130, 246, 0.9)', marginBottom: '0.3rem' }}>
                      📦 LUGGAGE CHARGE
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {surgeInfo.luggageSize === 'small' && 'Small (No extra charge)'}
                      {surgeInfo.luggageSize === 'medium' && 'Medium (+50% luggage fee)'}
                      {surgeInfo.luggageSize === 'large' && 'Large (+80% luggage fee)'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Multiplier: {(surgeInfo.luggageMultiplier).toFixed(1)}x</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'rgba(59, 130, 246, 0.9)' }}>
                      +₹{(fare - Math.round(surgeInfo.surge * surgeInfo.subtotal))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {(vehicleType === 'bike' || vehicleType === 'auto') && distance && (
              <Card style={{ 
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15))',
                border: '2px solid rgba(16, 185, 129, 0.5)',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '2rem' }}>🌿</span>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#10b981', marginBottom: '0.25rem' }}>
                      ECO-FRIENDLY CHOICE
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      By choosing a {vehicleType === 'bike' ? 'Bike' : 'Auto Rickshaw'}, you will save approximately{' '}
                      <strong>
                        {(distance * (vehicleType === 'bike' ? 0.12 : 0.08)).toFixed(2)} kg
                      </strong>{' '}
                      of CO₂ emissions compared to an SUV!
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={estimate}
            disabled={loading || !pickup.lat || !drop.lat}
          >
            <FiDollarSign /> Estimate Fare
          </Button>
          <Button
            variant="secondary"
            onClick={book}
            disabled={loading || !pickup.lat || !drop.lat}
          >
            <FiNavigation /> Book Ride
          </Button>
        </div>
      </Card>

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
        <div className="modal-body" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Your Ride ID
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
              {rideOtp.rideId}
            </div>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.15))',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            border: '2px solid var(--primary)'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pickup OTP
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-light)', letterSpacing: '0.2em' }}>
              {rideOtp.pickup_otp}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Share this code with your driver
            </div>
          </div>

          {rideOtp.drop_otp && (
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.15))',
              padding: '1rem',
              borderRadius: '0.75rem',
              marginBottom: '1.5rem',
              border: '1px solid rgba(168, 85, 247, 0.3)'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Drop OTP
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.2em' }}>
                {rideOtp.drop_otp}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Used to confirm delivery
              </div>
            </div>
          )}

          <div style={{ 
            background: 'rgba(59, 130, 246, 0.1)',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.5'
          }}>
            <strong>⏱️ Driver will arrive soon</strong><br/>
            Keep your OTP handy and share it when the driver arrives. You can also track your ride in real-time.
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
    </>
  );
}
