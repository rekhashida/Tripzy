import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTruck, FiPlay, FiCheckCircle, FiMap, FiPower, FiMapPin, FiDollarSign, FiStar, FiUser, FiMessageSquare } from 'react-icons/fi';
import api from '../services/api';
import { connectDriver, onNewRide, offNewRide, onRideAssigned, offRideAssigned, getSocket } from '../services/socket';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const statusLabel = {
  pending: 'Pending',
  driver_assigned: 'Assigned',
  otp_verified: 'Verified',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export default function DriverDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otpInputs, setOtpInputs] = useState({});
  const [locationStatus, setLocationStatus] = useState('');
  const [matchingRides, setMatchingRides] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [activeChatRideId, setActiveChatRideId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMsgText, setNewMsgText] = useState('');
  const chatEndRef = useRef(null);
  const [settlements, setSettlements] = useState([]);
  const [kycUploading, setKycUploading] = useState(false);
  const [kycMsg, setKycMsg] = useState('');
  const [kycMsgType, setKycMsgType] = useState('info');
  const [kycFiles, setKycFiles] = useState({ license: '', rc: '', insurance: '' });
  const navigate = useNavigate();

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000);
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/driver/dashboard');
      setDashboard(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to load driver dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const loadMatchingRides = async () => {
    try {
      const { data } = await api.get('/driver/requests');
      setMatchingRides(data || []);
    } catch (err) {
      // ignore; will show in dashboard if needed
    }
  };

  const loadSettlements = async () => {
    try {
      const { data } = await api.get('/driver/settlements');
      setSettlements(data || []);
    } catch (err) {
      console.warn('Failed to load settlements:', err.message);
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setKycFiles((prev) => ({ ...prev, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitKYC = async () => {
    if (!kycFiles.license || !kycFiles.rc || !kycFiles.insurance) {
      setKycMsg('Please upload all 3 documents: License, RC, and Insurance.');
      setKycMsgType('error');
      return;
    }
    setKycUploading(true);
    setKycMsg('AI OCR Engine scanning uploaded documents...');
    setKycMsgType('info');
    try {
      const { data } = await api.post('/driver/kyc', kycFiles);
      setKycMsg(data.message);
      setKycMsgType(data.kyc_status === 'verified' ? 'success' : 'error');
      await loadDashboard();
    } catch (err) {
      setKycMsg(err.response?.data?.error || 'KYC submission failed.');
      setKycMsgType('error');
    } finally {
      setKycUploading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadMatchingRides();
    loadSettlements();
  }, []);

  useEffect(() => {
    if (!dashboard?.driver?.id) return;

    connectDriver(dashboard.driver.id);

    const handleNewRide = (ride) => {
      setMatchingRides((prev) => [ride, ...prev].slice(0, 25));
      addToast(`New nearby ride request (#${ride.rideId})`);
    };

    const handleAssigned = ({ rideId }) => {
      addToast(`Ride #${rideId} assigned to you.`);
      loadDashboard();
      loadMatchingRides();
    };

    onNewRide(handleNewRide);
    onRideAssigned(handleAssigned);

    return () => {
      offNewRide();
      offRideAssigned();
    };
  }, [dashboard?.driver?.id]);

  const loadChats = async (rideId) => {
    try {
      const { data } = await api.get(`/rides/${rideId}/chats`);
      setChatMessages(data);
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err) {
      console.warn('Failed to load chat history:', err.message);
    }
  };

  const sendChatMessage = (quickText = '') => {
    const textToSubmit = quickText || newMsgText;
    if (!textToSubmit.trim() || !activeChatRideId) return;

    try {
      const s = getSocket();
      if (s) {
        s.emit('send-message', {
          rideId: activeChatRideId,
          senderId: dashboard.driver.user_id,
          senderName: dashboard.driver.name || 'Driver',
          message: textToSubmit
        });
      }
      if (!quickText) {
        setNewMsgText('');
      }
    } catch (sockErr) {
      console.warn('Socket message emit failed:', sockErr.message);
    }
  };

  useEffect(() => {
    if (!activeChatRideId) return;

    loadChats(activeChatRideId);

    try {
      const s = getSocket();
      if (s) {
        s.emit('join-ride', activeChatRideId);
      }
    } catch (err) {
      console.warn('Failed to join chat room:', err.message);
    }

    const newMessageHandler = (msg) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };

    let s = null;
    try {
      s = getSocket();
      if (s) {
        s.on('new-message', newMessageHandler);
      }
    } catch (sockErr) {
      console.warn('Socket message listener failed to bind:', sockErr.message);
    }

    return () => {
      if (s) {
        s.emit('leave-ride', activeChatRideId);
        s.off('new-message', newMessageHandler);
      }
    };
  }, [activeChatRideId]);

  const updateAvailability = async (isOnline) => {
    try {
      await api.put('/driver/availability', { is_online: isOnline });
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to change availability.');
    }
  };

  const handleAcceptRide = async (rideId) => {
    try {
      await api.post(`/driver/rides/${rideId}/accept`);
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to accept ride.');
    }
  };

  const handleRideAction = async (rideId, action) => {
    const otp = otpInputs[rideId] || '';
    if (!otp.trim()) {
      setError('Please enter the OTP provided by the rider.');
      return;
    }
    try {
      await api.post(`/driver/rides/${rideId}/status`, { action, otp });
      setOtpInputs((prev) => ({ ...prev, [rideId]: '' }));
      await loadDashboard();
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed.');
    }
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('Locating…');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await api.post('/tracking/driver-location', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationStatus('Location broadcasted to riders.');
        } catch (err) {
          setLocationStatus('Failed to send location.');
        }
      },
      () => {
        setLocationStatus('Unable to retrieve your location.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  if (loading) return <Loading message="Loading driver dashboard…" />;

  if (error) {
    return (
      <Card>
        <div className="text-center" style={{ padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
          <Button variant="primary" onClick={loadDashboard}>Try again</Button>
        </div>
      </Card>
    );
  }

  const { driver, stats, rides } = dashboard || {};

  if (!driver) {
    return (
      <Card>
        <div className="text-center" style={{ padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Driver profile not found. Please ensure you registered as a driver.</p>
          <Button variant="primary" onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </Card>
    );
  }

  return (
    <>
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              style={{
                minWidth: '260px',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(30, 41, 59, 0.95)',
                color: 'white',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
              }}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}

      <Card>
        <div className="card-header">
          <div>
            <h1 className="card-title">
              <FiTruck style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> Driver Dashboard
            </h1>
            <p className="card-subtitle">
              Manage your availability, see assigned rides, and keep your earnings on track.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant={driver.is_online ? 'secondary' : 'primary'}
              onClick={() => updateAvailability(!driver.is_online)}
              style={{ whiteSpace: 'nowrap' }}
            >
              <FiPower /> {driver.is_online ? 'Go Offline' : 'Go Online'}
            </Button>
            <Button variant="outline" onClick={handleShareLocation}>
              Share Location
            </Button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalTrips}</div>
            <div className="stat-label">Total Trips</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {parseFloat(stats.rating || 0).toFixed(1)} <FiStar style={{ marginLeft: '0.5rem', color: 'var(--warning)' }} />
            </div>
            <div className="stat-label">Driver Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">₹{parseFloat(stats.earnings || 0).toFixed(2)}</div>
            <div className="stat-label">Earnings</div>
          </div>
          <div className="stat-card" style={{ border: '1px solid var(--success)', background: 'rgba(16, 185, 129, 0.08)' }}>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              ⛽ ₹{parseFloat(driver.fuel_cashback_balance || 0).toFixed(2)}
            </div>
            <div className="stat-label" style={{ color: 'var(--success)' }}>Fuel Cashback Wallet</div>
          </div>
        </div>

        {/* Driver Leaderboard & Incentive Badges */}
        <Card style={{ marginTop: '1.25rem', marginBottom: '1.25rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(245, 158, 11, 0.08))', border: '1px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-light)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              🏆 Driver Weekly Incentive Leaderboard
            </h3>
            <span style={{ fontSize: '0.75rem', background: 'var(--primary)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '12px', fontWeight: 700 }}>
              ⭐ Rank #1 Captain
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'var(--bg-glass)', border: '1px solid var(--warning)', color: 'var(--warning)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
              🏅 Gold Captain Badge
            </span>
            <span style={{ background: 'var(--bg-glass)', border: '1px solid var(--success)', color: 'var(--success)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
              ⚡ 100% Acceptance Rate
            </span>
            <span style={{ background: 'var(--bg-glass)', border: '1px solid var(--primary)', color: 'var(--primary-light)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
              ⛽ ₹150 Fuel Cashback Active
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Complete 5 more trips this week to unlock ₹500 Weekly Bonus Multiplier!
          </div>
        </Card>

        {/* KYC Onboarding Card */}
        {dashboard?.driver && (
          <Card style={{ 
            marginTop: '1.5rem', 
            marginBottom: '1.5rem', 
            borderLeft: '4px solid ' + (dashboard.driver.kyc_status === 'verified' ? 'var(--success)' : dashboard.driver.kyc_status === 'rejected' ? 'var(--danger)' : 'var(--warning)'),
            background: 'var(--bg-secondary)'
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📄 KYC Document Verification status: 
              <Badge status={dashboard.driver.kyc_status === 'verified' ? 'completed' : dashboard.driver.kyc_status === 'rejected' ? 'cancelled' : dashboard.driver.kyc_status === 'pending' ? 'in_progress' : 'pending'}>
                {dashboard.driver.kyc_status === 'verified' ? 'Verified ✓' : dashboard.driver.kyc_status === 'rejected' ? 'Rejected ✗' : dashboard.driver.kyc_status === 'pending' ? 'Pending Review ⌛' : 'Action Required ⚠️'}
              </Badge>
            </h2>
            
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Upload your documents below to complete onboarding and verify your credentials using our automated AI OCR scanner.
            </p>

            {kycMsg && (
              <div className={`alert alert-${kycMsgType === 'success' ? 'success' : kycMsgType === 'error' ? 'error' : 'info'}`} style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                {kycMsg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Driver License (DL) Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'license')} 
                  disabled={dashboard.driver.kyc_status === 'verified' || kycUploading}
                  style={{ fontSize: '0.75rem', width: '100%', color: 'var(--text-muted)' }} 
                />
                {dashboard.driver.license_url && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--success)' }}>
                    ✓ DL Document Logged
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Vehicle Registration (RC)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'rc')} 
                  disabled={dashboard.driver.kyc_status === 'verified' || kycUploading}
                  style={{ fontSize: '0.75rem', width: '100%', color: 'var(--text-muted)' }} 
                />
                {dashboard.driver.rc_url && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--success)' }}>
                    ✓ RC Document Logged
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Vehicle Insurance Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'insurance')} 
                  disabled={dashboard.driver.kyc_status === 'verified' || kycUploading}
                  style={{ fontSize: '0.75rem', width: '100%', color: 'var(--text-muted)' }} 
                />
                {dashboard.driver.insurance_url && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--success)' }}>
                    ✓ Insurance Logged
                  </div>
                )}
              </div>
            </div>

            {dashboard.driver.kyc_status !== 'verified' && (
              <Button 
                variant="primary" 
                onClick={handleSubmitKYC} 
                disabled={kycUploading || !kycFiles.license || !kycFiles.rc || !kycFiles.insurance}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                {kycUploading ? 'Running AI OCR Scanning...' : 'Scan & Submit Documents'}
              </Button>
            )}

            {dashboard.driver.kyc_status === 'verified' && (
              <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                🎉 Documents verified. Your driver profile is fully active!
              </div>
            )}
          </Card>
        )}

        <div style={{ margin: '2rem 0' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Earnings (Last 6 Months)</h2>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.earningsByMonth} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--text-primary)' }}
                  formatter={(value) => [`₹${value}`, 'Earnings']}
                />
                <Bar dataKey="earnings" fill="rgba(99, 102, 241, 0.8)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payout Settlements Ledger */}
        <div style={{ margin: '2rem 0' }}>
          <h2 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            💳 Bank Settlement Payouts (Threshold: ₹500)
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Once your wallet exceeds ₹500, a simulated payout to your bank account is triggered automatically.
          </p>
          
          {settlements.length === 0 ? (
            <div style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border-color)' }}>
              No bank settlements processed yet. Complete more rides to hit the ₹500 threshold!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {settlements.map((s) => (
                <div key={s.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
                      ₹{parseFloat(s.amount).toFixed(2)} Transfer
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      Ref: {s.bank_reference}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Badge status="completed">PROCESSED</Badge>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {new Date(s.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Card style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div>
              <h2 className="card-title" style={{ fontSize: '1.25rem' }}>Nearby Ride Requests</h2>
              <p className="card-subtitle" style={{ marginTop: '0.25rem' }}>
                Accept requests near your current location. Keep sharing location for accurate matching.
              </p>
            </div>
            <Button variant="outline" onClick={loadMatchingRides}>
              Refresh
            </Button>
          </div>

          {matchingRides.length === 0 ? (
            <div className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: '0.5rem' }}>No nearby requests right now.</p>
              <p style={{ fontSize: '0.9rem' }}>Ensure you're online and sharing your location to receive requests.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {matchingRides.map((ride) => (
                <div key={ride.id} className="list-item" style={{ padding: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700 }}>#{ride.id}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{ride.distance_km} km away</span>
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <FiMapPin style={{ color: 'var(--success)' }} />
                        <span>{ride.pickup_address || `${ride.pickup_lat}, ${ride.pickup_lng}`}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                        <FiMapPin style={{ color: 'var(--danger)' }} />
                        <span>{ride.drop_address || `${ride.drop_lat}, ${ride.drop_lng}`}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
                    <Button variant="primary" onClick={() => handleAcceptRide(ride.id)}>
                      <FiPlay /> Accept (₹{ride.fare})
                    </Button>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        placeholder="Counter ₹" 
                        id={`counter_${ride.id}`}
                        style={{ width: '80px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.3rem 0.4rem', fontSize: '0.75rem' }} 
                      />
                      <Button 
                        variant="outline" 
                        size="small" 
                        onClick={async () => {
                          const val = document.getElementById(`counter_${ride.id}`)?.value;
                          if (!val) return alert('Enter counter bid amount!');
                          try {
                            await api.post(`/rides/${ride.id}/bids`, { bid_amount: parseFloat(val) });
                            addToast(`Submitted ₹${val} counter-bid for Ride #${ride.id}!`);
                          } catch (e) {
                            alert(e.response?.data?.error || 'Bid submission failed');
                          }
                        }}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                      >
                        🏷️ Bid
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {locationStatus && (
          <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
            {locationStatus}
          </div>
        )}

        {rides.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
            <FiMap style={{ fontSize: '3rem', marginBottom: '1rem' }} />
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No rides assigned yet.</p>
            <p>Keep your status online so riders can request you.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {rides.map((ride) => (
              <div key={ride.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                <div className="list-item">
                  <div className="list-item-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>#{ride.id}</span>
                      <Badge status={ride.status}>{statusLabel[ride.status] || ride.status}</Badge>
                      {ride.vehicle_type && <Badge status="in_progress">{ride.vehicle_type}</Badge>}
                    </div>

                    <div className="list-item-title" style={{ marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <FiMapPin style={{ color: 'var(--success)', marginTop: '0.25rem' }} />
                        <span>{ride.pickup_address || 'Pickup location'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <FiMapPin style={{ color: 'var(--danger)', marginTop: '0.25rem' }} />
                        <span>{ride.drop_address || 'Drop location'}</span>
                      </div>
                    </div>

                    <div className="list-item-subtitle" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                      {ride.fare && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FiDollarSign /> ₹{ride.fare}
                        </span>
                      )}
                      {ride.distance_km && <span>{ride.distance_km} km</span>}
                      {ride.duration_min && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FiTruck /> {ride.duration_min} min
                        </span>
                      )}
                      {ride.rider_name && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FiUser /> {ride.rider_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '160px' }}>
                    {(ride.status === 'pending' || ride.status === 'driver_assigned') && (
                      <Button variant="primary" onClick={() => handleAcceptRide(ride.id)}>
                        <FiPlay /> Accept
                      </Button>
                    )}

                    {['driver_assigned', 'otp_verified', 'in_progress'].includes(ride.status) && (
                      <>
                        <input
                          type="text"
                          placeholder="Enter OTP"
                          className="form-input"
                          value={otpInputs[ride.id] || ''}
                          onChange={(e) => setOtpInputs((prev) => ({ ...prev, [ride.id]: e.target.value }))}
                          style={{ width: '100%', marginBottom: '0.5rem' }}
                        />
                        <Button
                          variant="secondary"
                          onClick={() => handleRideAction(ride.id, ride.status === 'in_progress' ? 'complete' : 'start')}
                        >
                          <FiCheckCircle /> {ride.status === 'in_progress' ? 'Complete Ride' : 'Start Ride'}
                        </Button>
                      </>
                    )}

                    {(ride.status === 'in_progress' || ride.status === 'driver_assigned' || ride.status === 'otp_verified') && (
                      <>
                        <Link to={`/tracking/${ride.id}`}>
                          <Button variant="outline" style={{ whiteSpace: 'nowrap', width: '100%' }}>
                            <FiMap /> Track
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          onClick={() => setActiveChatRideId(activeChatRideId === ride.id ? null : ride.id)}
                          style={{ whiteSpace: 'nowrap', marginTop: '0.25rem', width: '100%' }}
                        >
                          <FiMessageSquare /> {activeChatRideId === ride.id ? 'Close Chat' : 'Chat with Rider'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {activeChatRideId === ride.id && (
                  <Card style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', marginBottom: '1.25rem', padding: '0.85rem' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-light)' }}>
                      💬 Chat with Rider
                    </h4>
                    
                    <div style={{
                      height: '150px',
                      overflowY: 'auto',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '0.5rem',
                      marginBottom: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      {chatMessages.length === 0 ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '3.5rem' }}>
                          No messages yet. Send a quick template message to your rider!
                        </div>
                      ) : (
                        chatMessages.map((msg, index) => {
                          const isMe = msg.sender_id === dashboard.driver.user_id;
                          return (
                            <div key={msg.id || index} style={{
                              alignSelf: isMe ? 'flex-end' : 'flex-start',
                              background: isMe ? 'var(--primary)' : 'var(--bg-secondary)',
                              color: isMe ? '#fff' : 'var(--text-primary)',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              maxWidth: '80%',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                              textAlign: 'left'
                            }}>
                              <div style={{ fontWeight: 700, fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.15rem' }}>
                                {isMe ? 'You' : (msg.sender_name || 'Rider')}
                              </div>
                              <div>{msg.message}</div>
                              <div style={{ fontSize: '0.6rem', opacity: 0.6, marginTop: '0.2rem', textAlign: 'right' }}>
                                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.75rem' }}>
                      {['I have arrived at your location 🚘', 'Stuck in heavy traffic 🚦', 'On my way! 🏃‍♂️', 'Ok, got it! 👍'].map((reply) => (
                        <button
                          key={reply}
                          onClick={() => sendChatMessage(reply)}
                          style={{
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#34d399',
                            border: '1px solid #10b981',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                          }}
                        >
                          {reply}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Type a message..."
                        className="form-input"
                        value={newMsgText}
                        onChange={(e) => setNewMsgText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                        style={{ flex: 1, padding: '0.4rem 0.6rem' }}
                      />
                      <Button variant="primary" onClick={() => sendChatMessage()} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                        Send
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
