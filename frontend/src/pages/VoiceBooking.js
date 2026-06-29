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
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;
    
    // Set dynamic language code
    recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : lang === 'gu' ? 'gu-IN' : 'en-IN';
    
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
    setMsg(
      lang === 'hi' 
        ? 'आवाज़ इनपुट रुका। स्थानों को खोजने के लिए "आवाज़ इनपुट पार्स करें" पर क्लिक करें।' 
        : lang === 'gu' 
          ? 'અવાજ ઇનપુટ અટકાવવામાં આવ્યો. સ્થાનો શોધવા માટે "અવાજ ઇનપુટ વિશ્લેષણ કરો" પર ક્લિક કરો.' 
          : 'Voice input stopped. Click "Parse voice input" to resolve coordinates.'
    );
    setMsgType('info');
  };

  // Extract address names from voice input and search them on Nominatim
  const parseVoiceInput = async () => {
    if (!transcript) {
      setMsg(lang === 'hi' ? 'कृपया पहले अपना मार्ग बोलें या लिखें।' : lang === 'gu' ? 'કૃપા કરીને પહેલા તમારો માર્ગ બોલો અથવા લખો.' : 'Please speak or enter your route description first.');
      setMsgType('error');
      return;
    }

    setLoading(true);
    setMsg(lang === 'hi' ? 'पते खोजे जा रहे हैं और निर्देशांक प्राप्त किए जा रहे हैं...' : lang === 'gu' ? 'સરનામાં શોધવામાં આવી રહ્યા છે અને કોઓર્ડિનેટ્સ મેળવવામાં આવી રહ્યા છે...' : 'Extracting addresses and fetching coordinates...');
    setMsgType('info');

    // Parse route by language structure
    let match;
    let rawPickup = '';
    let rawDrop = '';

    if (lang === 'hi') {
      // Matches: "X से Y" or "X से Y तक"
      match = transcript.match(/(.+?)\s*से\s+(.+?)(?:\s*तक)?$/i);
      if (match) {
        rawPickup = match[1].trim();
        rawDrop = match[2].trim();
      }
    } else if (lang === 'gu') {
      // Matches: "X થી Y" or "X થી Y સુધી"
      match = transcript.match(/(.+?)\s*થી\s+(.+?)(?:\s*સુધી)?$/i);
      if (match) {
        rawPickup = match[1].trim();
        rawDrop = match[2].trim();
      }
    } else {
      // English Matches: "from [Pickup] to [Drop]"
      match = transcript.match(/from\s+(.+?)\s+to\s+(.+)/i);
      if (match) {
        rawPickup = match[1].trim();
        rawDrop = match[2].trim();
      }
    }

    if (!rawPickup || !rawDrop) {
      setMsg(
        lang === 'hi'
          ? 'मार्ग पार्स नहीं किया जा सका। कृपया इस प्रारूप में बोलें/लिखें: "[स्थान] से [स्थान]"'
          : lang === 'gu'
            ? 'માર્ગ શોધી શકાયો નથી. કૃપા કરીને આ ફોર્મેટમાં બોલો/લખો: "[સ્થાન] થી [સ્થાન]"'
            : 'Could not parse route. Please say/type it in the format: "from [Location] to [Location]"'
      );
      setMsgType('error');
      setLoading(false);
      return;
    }

    try {
      // Fetch coordinates for pickup location (bias to India/Vadodara)
      const pUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawPickup + ' Vadodara')}&limit=1&countrycodes=in&viewbox=72.8,22.5,73.6,22.1&bounded=0`;
      const pRes = await fetch(pUrl);
      const pData = await pRes.json();

      // Fetch coordinates for dropoff location (bias to India/Vadodara)
      const dUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(rawDrop + ' Vadodara')}&limit=1&countrycodes=in&viewbox=72.8,22.5,73.6,22.1&bounded=0`;
      const dRes = await fetch(dUrl);
      const dData = await dRes.json();

      if (pData.length === 0) {
        setMsg(lang === 'hi' ? `पिकअप स्थान नहीं मिला: "${rawPickup}"` : lang === 'gu' ? `પીકઅપ સ્થાન મળ્યું નથી: "${rawPickup}"` : `Could not resolve pickup location: "${rawPickup}". Please search it manually below.`);
        setMsgType('error');
        setLoading(false);
        return;
      }

      if (dData.length === 0) {
        setMsg(lang === 'hi' ? `ड्रॉप स्थान नहीं मिला: "${rawDrop}"` : lang === 'gu' ? `ડ્રોપ સ્થાન મળ્યું નથી: "${rawDrop}"` : `Could not resolve dropoff location: "${rawDrop}". Please search it manually below.`);
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

      setMsg(
        lang === 'hi'
          ? `सफलतापूर्वक स्थान प्राप्त हुए!\n• पिकअप: ${newPickup.address}\n• ड्रॉप: ${newDrop.address}`
          : lang === 'gu'
            ? `સ્થાન સફળતાપૂર્વક મળ્યા!\n• પીકઅપ: ${newPickup.address}\n• ડ્રોપ: ${newDrop.address}`
            : `Resolved successfully!\n• Pickup: ${newPickup.address}\n• Dropoff: ${newDrop.address}`
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
            {lang === 'hi' ? 'आवाज़ इनपुट (या स्वयं लिखें)' : lang === 'gu' ? 'અવાજ ઇનપુટ (અથવા જાતે લખો)' : 'Voice Input (or type manually)'}
          </label>
          <textarea
            className="form-textarea"
            rows={3}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={
              lang === 'hi' 
                ? "जैसे: 'गोत्री से वृन्दावन सर्कल'" 
                : lang === 'gu' 
                  ? "જેમ કે: 'ગોત્રી થી વૃંદાવન સર્કલ'" 
                  : "Speak or type: 'from Gotri to Vrundavan Circle'"
            }
            style={{ fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {!listening ? (
            <Button variant="primary" onClick={startListening} disabled={loading}>
              <FiMic /> {t('voice_start')}
            </Button>
          ) : (
            <Button variant="danger" onClick={stopListening}>
              <FiMicOff /> {t('voice_stop')}
            </Button>
          )}

          <Button variant="secondary" onClick={parseVoiceInput} disabled={loading || !transcript}>
            ⚙️ {t('voice_parse')}
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
