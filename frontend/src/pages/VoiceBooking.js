import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMic, FiMicOff, FiNavigation, FiMapPin } from 'react-icons/fi';
import api from '../services/api';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

export default function VoiceBooking() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [pickupLat, setPickupLat] = useState(null);
  const [pickupLng, setPickupLng] = useState(null);
  const [dropLat, setDropLat] = useState(null);
  const [dropLng, setDropLng] = useState(null);
  const [loading, setLoading] = useState(false);
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
    setMsg('Listening... Speak your pickup and drop locations (e.g., "from Ahmedabad to Gandhinagar")');
    setMsgType('info');
    recognitionRef.current.start();
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
    setMsg('Voice input stopped. You can edit the text below or enter coordinates manually.');
    setMsgType('info');
  };

  const parseAndBook = async () => {
    if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
      setMsg('Please enter pickup and drop coordinates to book.');
      setMsgType('error');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const { data } = await api.post('/rides', {
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        drop_lat: dropLat,
        drop_lng: dropLng,
        pickup_address: transcript || 'Voice booking',
        drop_address: 'Voice booking',
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

  return (
    <Card>
      <h1 className="card-title">
        <FiMic style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
        Voice-Based Booking
      </h1>
      <p className="card-subtitle">Use your voice to book a ride. Speak your pickup and drop locations, then enter coordinates.</p>

      {msg && (
        <div className={`alert alert-${msgType === 'success' ? 'success' : msgType === 'error' ? 'error' : 'info'}`}>
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
          rows={4}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="e.g., from Ahmedabad to Gandhinagar"
          style={{ fontFamily: 'inherit' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {!listening ? (
          <Button variant="primary" onClick={startListening}>
            <FiMic /> Start Voice Input
          </Button>
        ) : (
          <Button variant="danger" onClick={stopListening}>
            <FiMicOff /> Stop Listening
          </Button>
        )}
        {listening && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 'var(--border-radius)',
            color: '#f87171'
          }}>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              background: '#f87171',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}></div>
            Listening...
          </div>
        )}
      </div>

      <div style={{ 
        padding: '1.5rem', 
        background: 'var(--bg-tertiary)', 
        borderRadius: 'var(--border-radius)',
        marginBottom: '1.5rem',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          Enter Coordinates Manually
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input
            label={
              <>
                <FiMapPin style={{ marginRight: '0.5rem' }} />
                Pickup (lat, lng)
              </>
            }
            placeholder="e.g. 23.0225, 72.5714"
            onChange={(e) => {
              const [a, b] = e.target.value.split(',').map(Number);
              if (!isNaN(a) && !isNaN(b)) {
                setPickupLat(a);
                setPickupLng(b);
              }
            }}
          />

          <Input
            label={
              <>
                <FiMapPin style={{ marginRight: '0.5rem' }} />
                Drop (lat, lng)
              </>
            }
            placeholder="e.g. 23.0300, 72.5800"
            onChange={(e) => {
              const [a, b] = e.target.value.split(',').map(Number);
              if (!isNaN(a) && !isNaN(b)) {
                setDropLat(a);
                setDropLng(b);
              }
            }}
          />
        </div>
      </div>

      <Button
        variant="primary"
        onClick={parseAndBook}
        disabled={loading || !pickupLat || !dropLat}
        className="w-full"
      >
        <FiNavigation /> {loading ? 'Booking...' : 'Book Ride'}
      </Button>
    </Card>
  );
}
