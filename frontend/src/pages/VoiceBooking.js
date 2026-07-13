import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMic, FiMicOff, FiNavigation, FiMapPin, FiCheckCircle } from 'react-icons/fi';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Map, { MapAutocomplete } from '../components/Map';
import { useLanguage } from '../context/LanguageContext';

export default function VoiceBooking() {
  const { lang, t } = useLanguage();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');
  const [loading, setLoading] = useState(false);

  const [pickup, setPickup] = useState({ address: '', lat: null, lng: null });
  const [drop, setDrop] = useState({ address: '', lat: null, lng: null });

  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  // Re-initialize speech recognition language when platform language changes
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMsg(lang === 'hi' ? 'आपके ब्राउज़र में आवाज़ पहचान समर्थित नहीं है।' : lang === 'gu' ? 'તમારા બ્રાઉઝરમાં અવાજ ઓળખ સમર્થિત નથી.' : 'Voice recognition is not supported in this browser.');
      setMsgType('error');
      return;
    }
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false; // Auto-stops when user finishes speaking single sentence
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;
    
    // Set dynamic language code
    recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : lang === 'gu' ? 'gu-IN' : 'en-IN';
    
    recognitionRef.current.onresult = (e) => {
      if (e.results.length > 0) {
        const finalTranscript = e.results[0][0].transcript.trim();
        setTranscript(finalTranscript);
        setListening(false);
        // Automatically trigger robust parsing on speech detection completion!
        autoParseVoice(finalTranscript);
      }
    };

    recognitionRef.current.onspeechend = () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setListening(false);
    };

    recognitionRef.current.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      setMsg(lang === 'hi' ? 'आवाज़ पहचान त्रुटि। कृपया पुनः प्रयास करें।' : lang === 'gu' ? 'અવાજ ઓળખ ભૂલ. કૃપા કરીને ફરીથી પ્રયાસ કરો.' : 'Voice recognition error. Please try again.');
      setMsgType('error');
      setListening(false);
    };

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [lang]);

  const startListening = () => {
    if (!recognitionRef.current) {
      setMsg('Voice recognition not available. Please use Chrome browser.');
      setMsgType('error');
      return;
    }
    setTranscript('');
    setPickup({ address: '', lat: null, lng: null });
    setDrop({ address: '', lat: null, lng: null });
    setMsg(
      lang === 'hi' 
        ? 'सुन रहा हूँ... अपना मार्ग बोलें (जैसे, "गोत्री से वृन्दावन")' 
        : lang === 'gu' 
          ? 'સાંભળી રહ્યા છીએ... તમારો માર્ગ બોલો (જેમ કે, "ગોત્રી થી વૃંદાવન")' 
          : 'Listening... Speak your route (e.g., "from Gotri to Vrundavan Circle")'
    );
    setMsgType('info');
    recognitionRef.current.start();
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  // Robust geocoding and parsing method
  const autoParseVoice = async (textToParse) => {
    if (!textToParse) return;
    setLoading(true);
    setMsg(lang === 'hi' ? 'मार्ग पार्स किया जा रहा है...' : lang === 'gu' ? 'માર્ગ વિશ્લેષણ કરવામાં આવી રહ્યો છે...' : 'Analyzing route...');
    setMsgType('info');

    let rawPickup = '';
    let rawDrop = '';

    // Normalize input to strip initial keywords (e.g. "go from", "book ride from", "please from")
    const normalized = textToParse.replace(/^(go|book|ride|please|from|take me from|सवारी बुक करें|બુક કરો)\s+/i, '').trim();

    // 1. Language-specific regex parsing
    if (lang === 'hi') {
      const match = normalized.match(/(.+?)\s*से\s+(.+?)(?:\s*तक)?$/i);
      if (match) {
        rawPickup = match[1].trim();
        rawDrop = match[2].trim();
      }
    } else if (lang === 'gu') {
      const match = normalized.match(/(.+?)\s*થી\s+(.+?)(?:\s*સુધી)?$/i);
      if (match) {
        rawPickup = match[1].trim();
        rawDrop = match[2].trim();
      }
    } else {
      const match = normalized.match(/(.+?)\s+to\s+(.+)/i);
      if (match) {
        rawPickup = match[1].trim();
        rawDrop = match[2].trim();
      }
    }

    // 2. Fallback: Split by common prepositions across all languages
    if (!rawPickup || !rawDrop) {
      const parts = normalized.split(/\s+(?:to|से|થી|—|-)\s+/i);
      if (parts.length === 2) {
        rawPickup = parts[0].trim();
        rawDrop = parts[1].trim();
      }
    }

    if (!rawPickup || !rawDrop) {
      setMsg(
        lang === 'hi'
          ? `मार्ग समझ नहीं आया ("${textToParse}"). कृपया इस प्रारूप में बोलें: "[पिकअप] से [ड्रॉप]"`
          : lang === 'gu'
            ? `માર્ગ સમજી શકાયો નથી ("${textToParse}"). કૃપા કરીને આ ફોર્મેટમાં બોલો: "[પીકઅપ] થી [ડ્રોપ]"`
            : `Could not parse route ("${textToParse}"). Please speak in the format: "[Pickup] to [Dropoff]"`
      );
      setMsgType('error');
      setLoading(false);
      return;
    }

    try {
      // Fetch coordinates for pickup location (bias to Vadodara)
      const pUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawPickup + ' Vadodara')}&limit=1&countrycodes=in&viewbox=72.8,22.5,73.6,22.1&bounded=0`;
      const pRes = await fetch(pUrl);
      const pData = await pRes.json();

      // Fetch coordinates for dropoff location (bias to Vadodara)
      const dUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawDrop + ' Vadodara')}&limit=1&countrycodes=in&viewbox=72.8,22.5,73.6,22.1&bounded=0`;
      const dRes = await fetch(dUrl);
      const dData = await dRes.json();

      let finalP = pData[0];
      let finalD = dData[0];

      // Geocode fallback without "Vadodara" bias for broader India queries
      if (!finalP) {
        const pFallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawPickup)}&limit=1&countrycodes=in`);
        const pFallbackData = await pFallbackRes.json();
        finalP = pFallbackData[0];
      }

      if (!finalD) {
        const dFallbackRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawDrop)}&limit=1&countrycodes=in`);
        const dFallbackData = await dFallbackRes.json();
        finalD = dFallbackData[0];
      }

      if (!finalP) {
        setMsg(lang === 'hi' ? `पिकअप स्थान नहीं मिला: "${rawPickup}"` : lang === 'gu' ? `પીકઅપ સ્થાન મળ્યું નથી: "${rawPickup}"` : `Could not resolve pickup location: "${rawPickup}".`);
        setMsgType('error');
        setLoading(false);
        return;
      }

      if (!finalD) {
        setMsg(lang === 'hi' ? `ड्रॉप स्थान नहीं मिला: "${rawDrop}"` : lang === 'gu' ? `ડ્રોપ સ્થાન મળ્યું નથી: "${rawDrop}"` : `Could not resolve dropoff location: "${rawDrop}".`);
        setMsgType('error');
        setLoading(false);
        return;
      }

      const newPickup = {
        address: finalP.display_name,
        lat: parseFloat(finalP.lat),
        lng: parseFloat(finalP.lon)
      };

      const newDrop = {
        address: finalD.display_name,
        lat: parseFloat(finalD.lat),
        lng: parseFloat(finalD.lon)
      };

      setPickup(newPickup);
      setDrop(newDrop);

      setMsg(
        lang === 'hi'
          ? `स्थान प्राप्त हुए! कृपया नीचे विवरण की पुष्टि करें।\n• पिकअप: ${newPickup.address}\n• ड्रॉप: ${newDrop.address}`
          : lang === 'gu'
            ? `સ્થાન મળ્યા! કૃપા કરીને નીચે વિગતોની પુષ્ટિ કરો.\n• પીકઅપ: ${newPickup.address}\n• ડ્રોપ: ${newDrop.address}`
            : `Locations resolved successfully! Please confirm the details below.\n• Pickup: ${newPickup.address}\n• Dropoff: ${newDrop.address}`
      );
      setMsgType('success');
    } catch (err) {
      console.error(err);
      setMsg(lang === 'hi' ? 'स्थान खोजना विफल रहा। कृपया स्वयं लिखें।' : lang === 'gu' ? 'સ્થાન શોધવામાં નિષ્ફળતા. કૃપા કરીને જાતે લખો.' : 'Failed to fetch location data. Please input addresses manually.');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  const parseAndBook = async () => {
    if (!pickup.lat || !pickup.lng || !drop.lat || !drop.lng) {
      setMsg(t('voice_verify'));
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
      setMsg(lang === 'hi' ? `सवारी सफलतापूर्वक बुक की गई! आईडी: ${data.rideId}` : lang === 'gu' ? `રાઇડ સફળતાપૂર્વક બુક થઈ ગઈ! આઈડી: ${data.rideId}` : `Ride booked successfully! Ride ID: ${data.rideId}. Pickup OTP: ${data.pickup_otp}`);
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
          {t('voice_title')}
        </h1>
        <p className="card-subtitle">
          {t('voice_desc')}
        </p>

        {msg && (
          <div className={`alert alert-${msgType === 'success' ? 'success' : msgType === 'error' ? 'error' : 'info'}`} style={{ whiteSpace: 'pre-line' }}>
            {msg}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">
            <FiMic style={{ marginRight: '0.5rem' }} />
            {lang === 'hi' ? 'बोला गया मार्ग (स्वचालित रूप से भरा जाएगा)' : lang === 'gu' ? 'બોલાયેલ માર્ગ (આપોઆપ ભરાઈ જશે)' : 'Spoken Route (Will be automatically filled)'}
          </label>
          <textarea
            className="form-textarea"
            rows={2}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={
              lang === 'hi' 
                ? "जैसे: 'गोत्री से वृन्दावन'" 
                : lang === 'gu' 
                  ? "જેમ કે: 'ગોત્રી થી વૃંદાવન'" 
                  : "Say: 'from Gotri to Vrundavan Circle'"
            }
            style={{ fontFamily: 'inherit' }}
            readOnly
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {!listening ? (
            <Button variant="primary" onClick={startListening} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiMic /> {lang === 'hi' ? 'आवाज़ बुकिंग शुरू करें 🎙️' : lang === 'gu' ? 'અવાજ બુકિંગ શરૂ કરો 🎙️' : 'Start Voice Booking 🎙️'}
            </Button>
          ) : (
            <Button variant="danger" onClick={stopListening} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiMicOff /> {lang === 'hi' ? 'रिकॉर्डिंग रोकें' : lang === 'gu' ? 'રેકોર્ડિંગ બંધ કરો' : 'Stop Recording'}
            </Button>
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
            {t('voice_verify')}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <label className="form-label">
                <FiMapPin style={{ marginRight: '0.5rem' }} /> {t('pickup')}
              </label>
              <MapAutocomplete
                onPlaceSelected={(place) => setPickup(place)}
                placeholder="Search pickup..."
                value={pickup.address}
              />
            </div>
            <div>
              <label className="form-label">
                <FiMapPin style={{ marginRight: '0.5rem' }} /> {t('drop')}
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
          <FiCheckCircle /> {t('voice_book_now')}
        </Button>
      </Card>

      {(pickup.lat || drop.lat) && (
        <Card style={{ padding: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600 }}>
            {lang === 'hi' ? 'मार्ग नक्शा पूर्वावलोकन' : lang === 'gu' ? 'માર્ગ નકશો પૂર્વાવલોકન' : 'Route Map preview'}
          </h3>
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
