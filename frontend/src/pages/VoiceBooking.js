import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMic, FiMicOff, FiNavigation, FiMapPin, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Map, { MapAutocomplete } from '../components/Map';

export default function VoiceBooking() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [loading, setLoading] = useState(false);

  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null });
  const [drop, setDrop] = useState({ address: '', lat: null, lng: null });

  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMsg('Voice recognition is not supported in this browser. Please use Chrome or Edge.');
      setMsgType('error');
      return;
    }
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;
    recognitionRef.current.lang = 'en-IN';
    recognitionRef.current.onresult = (e) => {
      let finalTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript.trim() + ' ';
        }
      }
      finalTranscript = finalTranscript.trim();
      if (finalTranscript) {
        setTranscript((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
      }
    };
    recognitionRef.current.onerror = (e) => {
      setMsg('Voice recognition error. Please try again.');
      setMsgType('error');
      setListening(false);
    };
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      setMsg('Voice recognition not available. Please use Chrome browser.');
      setMsgType('error');
      return;
    }
    setTranscript('');
    setMsg('Listening... Speak your route (e.g., "from Gotri Road to Vrundavan Circle")');
    setMsgType('info');
    recognitionRef.current.start();
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
    setMsg('Voice input stopped. Click "Parse locations" to resolve coordinates.');
    setMsgType('info');
  };

  // Extract address names from voice input and search them on Nominatim
  const parseVoiceInput = async () => {
    if (!transcript) {
      setMsg('Please speak or enter your route description first.');
      setMsgType('error');
      return;
    }

    setLoading(true);
    setMsg('Extracting addresses and fetching coordinates...');
    setMsgType('info');

    // Matches: "from [Pickup Name] to [Dropoff Name]"
    const match = transcript.match(/from\s+(.+?)\s+to\s+(.+)/i);
    if (!match) {
      setMsg('Could not parse route. Please say/type it in the format: "from [Location] to [Location]"');
      setMsgType('error');
      setLoading(false);
      return;
    }

    const rawPickup = match[1].trim();
    const rawDrop = match[2].trim();

    try {
      // Fetch coordinates for pickup location (bias to India/Vadodara)
      const pUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawPickup + ' Vadodara')}&limit=1&countrycodes=in`;
      const pRes = await fetch(pUrl);
      const pData = await pRes.json();

      // Fetch coordinates for dropoff location (bias to India/Vadodara)
      const dUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawDrop + ' Vadodara')}&limit=1&countrycodes=in`;
      const dRes = await fetch(dUrl);
      const dData = await dRes.json();

      if (pData.length === 0) {
        setMsg(`Could not resolve pickup location: "${rawPickup}". Please search it manually below.`);
        setMsgType('error');
        setLoading(false);
        return;
      }

      if (dData.length === 0) {
        setMsg(`Could not resolve dropoff location: "${rawDrop}". Please search it manually below.`);
        setMsgType('error');
        setLoading(false);
        return;
      }

      const newPickup = {
        address: pData[0].display_name,
        lat: parseFloat(pData[0].lat),
        lng: parseFloat(pData[0].lon)
      };

      const newDrop = {
        address: dData[0].display_name,
        lat: parseFloat(dData[0].lat),
        lng: parseFloat(dData[0].lon)
      };

      setPickup(newPickup);
      setDrop(newDrop);

      setMsg(`Resolved successfully!\n• Pickup: ${newPickup.address}\n• Dropoff: ${newDrop.address}`);
      setMsgType('success');
    } catch (err) {
      console.error(err);
      setMsg('Failed to fetch location data. Please input addresses manually.');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const parseAndBook = async () => {
    if (!pickup.lat || !pickup.lng || !drop.lat || !drop.lng) {
      setMsg('Please search or parse pickup and drop locations to book.');
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
        pickup_address: pickup.address || 'Voice Booking Pickup',
        drop_address: drop.address || 'Voice Booking Dropoff',
        vehicle_type: 'sedan',
        is_pooling: false
      });
      setMsg(`Ride booked successfully! Ride ID: ${data.rideId}. Pickup OTP: ${data.pickup_otp}`);
      setMsgType('success');
      setTimeout(() => {
        navigate(`/tracking/${data.rideId}`);
      }, 2000);
    } catch (e) {
      setMsg(e.response?.data?.error || 'Booking failed. Please try again.');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  // Determine map configurations based on resolved points
  const mapCenter = pickup.lat ? pickup : { lat: 22.3072, lng: 73.1812 }; // Default Vadodara
  const markers = [];
  if (pickup.lat) markers.push({ lat: pickup.lat, lng: pickup.lng, title: 'Pickup' });
  if (drop.lat) markers.push({ lat: drop.lat, lng: drop.lng, title: 'Dropoff' });
  const path = pickup.lat && drop.lat ? [pickup, drop] : [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
      <Card>
        <h1 className="card-title">
          <FiMic style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Voice-Based Booking
        </h1>
        <p className="card-subtitle">
          Use your voice to book a ride. Speak your pickup and drop locations (e.g., "from Gotri to Vrundavan Circle") and confirm the locations.
        </p>

        {msg && (
          <div className={`alert alert-${msgType === 'success' ? 'success' : msgType === 'error' ? 'error' : 'info'}`} style={{ whiteSpace: 'pre-line' }}>
            {msg}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">
            <FiMic style={{ marginRight: '0.5rem' }} />
            Voice Input (or type manually)
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Speak or type: 'from Gotri to Vrundavan Circle'"
            style={{ fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {!listening ? (
            <Button variant="primary" onClick={startListening} disabled={loading}>
              <FiMic /> Start Recording
            </Button>
          ) : (
            <Button variant="danger" onClick={stopListening}>
              <FiMicOff /> Stop Recording
            </Button>
          )}

          <Button variant="secondary" onClick={parseVoiceInput} disabled={loading || !transcript}>
            ⚙️ Parse Voice Input
          </Button>
        </div>

        <div style={{ 
          padding: '1.5rem', 
          background: 'var(--bg-tertiary)', 
          borderRadius: 'var(--border-radius)',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
            Verify & Edit Locations
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <label className="form-label">
                <FiMapPin style={{ marginRight: '0.5rem' }} /> Pickup Location
              </label>
              <MapAutocomplete
                onPlaceSelected={(place) => setPickup(place)}
                placeholder="Search pickup..."
                value={pickup.address}
              />
            </div>
            <div>
              <label className="form-label">
                <FiMapPin style={{ marginRight: '0.5rem' }} /> Drop Location
              </label>
              <MapAutocomplete
                onPlaceSelected={(place) => setDrop(place)}
                placeholder="Search dropoff..."
                value={drop.address}
              />
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={parseAndBook}
          disabled={loading || !pickup.lat || !drop.lat}
          className="w-full"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <FiCheckCircle /> {loading ? 'Booking...' : 'Book Ride Now'}
        </Button>
      </Card>

      {(pickup.lat || drop.lat) && (
        <Card style={{ padding: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600 }}>Route Map preview</h3>
          <Map
            center={mapCenter}
            zoom={13}
            markers={markers}
            path={path}
            height={320}
          />
        </Card>
      )}
    </div>
  );
}
