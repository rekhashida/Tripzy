import React, { useState, useEffect } from 'react';
import { FiUsers, FiTruck, FiNavigation, FiPackage, FiDollarSign, FiTrendingUp, FiShield, FiSliders, FiActivity, FiSearch, FiVolume2, FiMail } from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import Card from '../components/Card';
import Loading from '../components/Loading';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Input from '../components/Input';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [kycDrivers, setKycDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation & Filtering states
  const [activeTab, setActiveTab] = useState('analytics');
  const [userSearch, setUserSearch] = useState('');
  const [rideSearch, setRideSearch] = useState('');
  const [parcelSearch, setParcelSearch] = useState('');

  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignMsg, setCampaignMsg] = useState('');
  const [campaignMsgType, setCampaignMsgType] = useState('info');

  const triggerSmsCampaign = async () => {
    setCampaignLoading(true);
    setCampaignMsg('');
    try {
      const { data } = await api.post('/admin/send-inactivity-reminders');
      if (data.success) {
        setCampaignMsg(data.message);
        setCampaignMsgType('success');
      } else {
        setCampaignMsg('Failed to trigger campaign.');
        setCampaignMsgType('error');
      }
    } catch (e) {
      setCampaignMsg(e.response?.data?.error || 'Failed to trigger campaign.');
      setCampaignMsgType('error');
    } finally {
      setCampaignLoading(false);
    }
  };

  const [sosAlerts, setSosAlerts] = useState([]);

  const loadKycDrivers = async () => {
    try {
      const { data } = await api.get('/admin/kyc');
      setKycDrivers(data || []);
    } catch (e) {
      console.warn('Failed to load kyc drivers:', e.message);
    }
  };

  const loadSosAlerts = async () => {
    try {
      const { data } = await api.get('/sos/admin/alerts');
      setSosAlerts(data || []);
    } catch (e) {
      console.warn('Failed to load SOS alerts:', e.message);
    }
  };

  const handleVerifyKyc = async (driverId, status) => {
    try {
      await api.post(`/admin/kyc/${driverId}/verify`, { status });
      await loadKycDrivers();
      loadData();
    } catch (e) {
      alert(e.response?.data?.error || 'Verification update failed.');
    }
  };

  const handleResolveSos = async (alertId) => {
    try {
      await api.post(`/sos/admin/alerts/${alertId}/resolve`);
      loadSosAlerts();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to resolve alert.');
    }
  };

  useEffect(() => {
    loadData();
    loadKycDrivers();
    loadSosAlerts();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, usersRes, ridesRes, parcelsRes, kycRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: null })),
        api.get('/admin/users').catch(() => ({ data: [] })),
        api.get('/admin/rides').catch(() => ({ data: [] })),
        api.get('/admin/parcels').catch(() => ({ data: [] })),
        api.get('/admin/kyc').catch(() => ({ data: [] }))
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data || []);
      setRides(ridesRes.data || []);
      setParcels(parcelsRes.data || []);
      setKycDrivers(kycRes.data || []);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading admin dashboard..." />;
  }

  // 1. Ride Status Chart
  const rideStatusData = rides.reduce((acc, ride) => {
    acc[ride.status] = (acc[ride.status] || 0) + 1;
    return acc;
  }, {});
  const rideStatusChart = Object.entries(rideStatusData).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value
  }));

  // 2. Parcel Status Chart
  const parcelStatusData = parcels.reduce((acc, parcel) => {
    acc[parcel.status] = (acc[parcel.status] || 0) + 1;
    return acc;
  }, {});
  const parcelStatusChart = Object.entries(parcelStatusData).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value
  }));

  // 3. User Roles
  const userRoleData = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});
  const userRoleChart = Object.entries(userRoleData).map(([name, value]) => ({
    name: name.toUpperCase(),
    value
  }));

  // 4. Revenue Trend (Daily grouping)
  const getRevenueTrendData = () => {
    const dailyRev = {};
    
    // Group rides
    rides.forEach(r => {
      if (r.status === 'completed' && r.created_at) {
        const dateStr = new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        dailyRev[dateStr] = (dailyRev[dateStr] || 0) + parseFloat(r.fare || 0);
      }
    });

    // Group parcels
    parcels.forEach(p => {
      if (p.status === 'delivered' && p.created_at) {
        const dateStr = new Date(p.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        dailyRev[dateStr] = (dailyRev[dateStr] || 0) + parseFloat(p.fare || 0);
      }
    });

    return Object.entries(dailyRev)
      .map(([date, revenue]) => ({ date, Revenue: Math.round(revenue) }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-10);
  };
  const revenueTrendData = getRevenueTrendData();

  // 5. Vehicle Type Popularity
  const getVehiclePopularityData = () => {
    const counts = { sedan: 0, hatchback: 0, suv: 0, auto: 0 };
    rides.forEach(r => {
      const type = r.vehicle_type?.toLowerCase() || 'sedan';
      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({
      name: name.toUpperCase(),
      Rides: count
    }));
  };
  const vehiclePopularityData = getVehiclePopularityData();

  // Search filter implementations
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredRides = rides.filter(r => 
    r.user_name?.toLowerCase().includes(rideSearch.toLowerCase()) ||
    r.driver_name?.toLowerCase().includes(rideSearch.toLowerCase()) ||
    r.pickup_address?.toLowerCase().includes(rideSearch.toLowerCase()) ||
    r.drop_address?.toLowerCase().includes(rideSearch.toLowerCase()) ||
    r.status?.toLowerCase().includes(rideSearch.toLowerCase())
  );

  const filteredParcels = parcels.filter(p => 
    p.recipient_name?.toLowerCase().includes(parcelSearch.toLowerCase()) ||
    p.pickup_address?.toLowerCase().includes(parcelSearch.toLowerCase()) ||
    p.drop_address?.toLowerCase().includes(parcelSearch.toLowerCase()) ||
    p.status?.toLowerCase().includes(parcelSearch.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '1.5rem auto', padding: '0 1rem' }}>
      {/* Banner / Title Header */}
      <Card style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <FiShield style={{ color: 'var(--primary)' }} />
              Tripzy Admin Console
            </h1>
            <p className="card-subtitle" style={{ margin: '0.25rem 0 0 0' }}>Manage platform operations, review interactive analytics, and audit logs.</p>
          </div>
          <Badge status="completed">Secure Session</Badge>
        </div>
      </Card>

      {/* Numerical Stats overview */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiUsers style={{ color: '#6366f1' }} />
              {stats.users || 0}
            </div>
            <div className="stat-label">Total Registered Accounts</div>
          </div>
          <div className="stat-card" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiTruck style={{ color: '#10b981' }} />
              {stats.drivers || 0}
            </div>
            <div className="stat-label">Active Drivers Onboarded</div>
          </div>
          <div className="stat-card" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiNavigation style={{ color: '#ec4899' }} />
              {stats.completedRides || 0}
            </div>
            <div className="stat-label">Total Rides Completed</div>
          </div>
          <div className="stat-card" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiPackage style={{ color: '#8b5cf6' }} />
              {stats.deliveredParcels || 0}
            </div>
            <div className="stat-label">Delivered Packages</div>
          </div>
          <div className="stat-card" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-light)' }}>
              ₹{stats.totalRevenue || 0}
            </div>
            <div className="stat-label">Total Revenue Earned</div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { id: 'analytics', label: '📊 Live Analytics', color: '#6366f1' },
          { id: 'users', label: '👥 User Accounts', color: '#10b981' },
          { id: 'rides', label: '🚗 Ride Log Audit', color: '#ec4899' },
          { id: 'parcels', label: '📦 Parcel Shipments', color: '#8b5cf6' },
          { id: 'campaigns', label: '📢 User Engagement', color: '#f59e0b' },
          { id: 'kyc', label: '🛡️ KYC Approvals', color: '#ef4444' },
          { id: 'sos', label: '🚨 Panic SOS Monitor', color: '#dc2626' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: '1px solid ' + (isActive ? tab.color : 'var(--border-color)'),
                background: isActive ? `${tab.color}18` : 'var(--bg-glass)',
                color: isActive ? tab.color : 'var(--text-primary)',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}

      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Revenue Trends Chart */}
          {revenueTrendData.length > 0 && (
            <Card>
              <h3 className="card-title" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiTrendingUp style={{ color: 'var(--primary)' }} /> Revenue Trends (Last 10 Days)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                  <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                  <YAxis stroke="var(--text-muted)" fontSize={11} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Vehicle Type Popularity */}
          <Card>
            <h3 className="card-title" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiActivity style={{ color: 'var(--primary)' }} /> Vehicle Category Preference
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vehiclePopularityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                <Bar dataKey="Rides" fill="#10b981" radius={[4, 4, 0, 0]}>
                  {vehiclePopularityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Ride status distribution */}
          {rideStatusChart.length > 0 && (
            <Card>
              <h3 className="card-title" style={{ fontSize: '1.15rem' }}>Ride Trip Status Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={rideStatusChart}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {rideStatusChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Parcel status distribution */}
          {parcelStatusChart.length > 0 && (
            <Card>
              <h3 className="card-title" style={{ fontSize: '1.15rem' }}>Parcel Status Logs</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={parcelStatusChart}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {parcelStatusChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <h3 className="card-title" style={{ fontSize: '1.25rem', margin: 0 }}>Registered User Base</h3>
            <div style={{ width: '300px' }}>
              <Input
                placeholder="Search by name, email, or role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ padding: '0.4rem 0.75rem' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>User ID</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Phone</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Wallet Balance</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Role Badge</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: 0.9 }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>#{u.id}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{u.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{u.email}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{u.phone}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--primary-light)', fontWeight: 700 }}>₹{u.wallet_balance}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}><Badge status={u.role}>{u.role}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'rides' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <h3 className="card-title" style={{ fontSize: '1.25rem', margin: 0 }}>Ride Dispatch Records</h3>
            <div style={{ width: '300px' }}>
              <Input
                placeholder="Search passenger, driver, or route..."
                value={rideSearch}
                onChange={(e) => setRideSearch(e.target.value)}
                style={{ padding: '0.4rem 0.75rem' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Ride ID</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Passenger</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Driver</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Route</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Fare Charged</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Vehicle</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Trip Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRides.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: 0.9 }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>#{r.id}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{r.user_name || 'N/A'}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{r.driver_name || 'Unassigned'}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem' }}>
                      <div><strong>From:</strong> {r.pickup_address?.substring(0, 30)}...</div>
                      <div><strong>To:</strong> {r.drop_address?.substring(0, 30)}...</div>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>₹{r.fare}</td>
                    <td style={{ padding: '0.75rem 0.5rem', textTransform: 'capitalize' }}>{r.vehicle_type}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}><Badge status={r.status}>{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'parcels' && (
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <h3 className="card-title" style={{ fontSize: '1.25rem', margin: 0 }}>Parcel Deliveries Audit</h3>
            <div style={{ width: '300px' }}>
              <Input
                placeholder="Search recipient or address..."
                value={parcelSearch}
                onChange={(e) => setParcelSearch(e.target.value)}
                style={{ padding: '0.4rem 0.75rem' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="w-full" style={{ borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Parcel ID</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Recipient</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Recipient Phone</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Addresses</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Weight</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Fare Charged</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Shipment Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredParcels.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: 0.9 }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>#{p.id}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{p.recipient_name}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{p.recipient_phone}</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem' }}>
                      <div><strong>From:</strong> {p.pickup_address?.substring(0, 30)}...</div>
                      <div><strong>To:</strong> {p.drop_address?.substring(0, 30)}...</div>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{p.weight_kg} kg</td>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>₹{p.fare}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}><Badge status={p.status}>{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'campaigns' && (
        <Card style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <h3 className="card-title" style={{ fontSize: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📢 Inactivity & Re-engagement SMS Nudges
          </h3>
          <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>
            Trigger a query to locate riders who have not booked any rides or parcels in the last 7 days. Tripzy system will automatically notify them with a customized promo code.
          </p>
          
          {campaignMsg && (
            <div className={`alert alert-${campaignMsgType}`} style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
              {campaignMsg}
            </div>
          )}

          <button 
            className="btn btn-primary"
            onClick={triggerSmsCampaign}
            disabled={campaignLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: 700 }}
          >
            <FiMail /> {campaignLoading ? 'Sending Nudges...' : 'Trigger Inactivity SMS Reminders'}
          </button>
        </Card>
      )}

      {activeTab === 'kyc' && (
        <Card style={{ border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
          <h3 className="card-title" style={{ fontSize: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🛡️ KYC Document Approval & Review Center
          </h3>
          <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>
            Review driver profile details, uploaded verification files, and automated AI OCR match results. Approve or reject applications to authorize driver bookings.
          </p>

          {kycDrivers.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No driver KYC submissions found. Drivers will appear here once they upload DL/RC documents.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Driver Info</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Vehicle Details</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Uploaded Docs</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>AI OCR Scan Matches</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kycDrivers.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div><strong>{d.driver_name}</strong></div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{d.driver_email}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{d.driver_phone}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div>No: {d.vehicle_number}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Type: {d.vehicle_type}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {d.license_url && (
                            <a href={d.license_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)', textDecoration: 'underline' }}>
                              License Doc 📄
                            </a>
                          )}
                          {d.rc_url && (
                            <a href={d.rc_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)', textDecoration: 'underline' }}>
                              RC Document 📄
                            </a>
                          )}
                          {d.insurance_url && (
                            <a href={d.insurance_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)', textDecoration: 'underline' }}>
                              Insurance Doc 📄
                            </a>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {d.ocr_license_number ? (
                          <div style={{ background: 'var(--bg-card)', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', minWidth: '180px' }}>
                            <div style={{ fontSize: '0.75rem' }}>
                              <strong>Scanned DL:</strong> {d.ocr_license_number}
                            </div>
                            <div style={{ fontSize: '0.75rem' }}>
                              <strong>Scanned Name:</strong> {d.ocr_name}
                            </div>
                            <div style={{ fontSize: '0.75rem' }}>
                              <strong>Expiry:</strong> {d.ocr_expiry_date ? new Date(d.ocr_expiry_date).toLocaleDateString() : 'N/A'}
                            </div>
                            <div style={{ 
                              marginTop: '0.35rem', 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              color: d.ocr_license_number === d.license_number ? 'var(--success)' : 'var(--danger)'
                            }}>
                              {d.ocr_license_number === d.license_number ? '✓ AI Match: 100%' : '✗ AI Match: MISMATCH'}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No OCR details</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <Badge status={d.kyc_status === 'verified' ? 'completed' : d.kyc_status === 'rejected' ? 'cancelled' : 'pending'}>
                          {d.kyc_status}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <Button 
                            variant="primary" 
                            onClick={() => handleVerifyKyc(d.id, 'verified')}
                            disabled={d.kyc_status === 'verified'}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleVerifyKyc(d.id, 'rejected')}
                            disabled={d.kyc_status === 'rejected'}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'sos' && (
        <Card style={{ border: '1px solid var(--danger)', background: 'var(--bg-secondary)' }}>
          <h3 className="card-title" style={{ fontSize: '1.25rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🚨 Live SOS Emergency Monitor
          </h3>
          <p className="card-subtitle" style={{ marginBottom: '1.5rem' }}>
            Real-time emergency distress signals, live GPS coordinates, and streamed Web Audio panic recordings.
          </p>

          {sosAlerts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No active or historical SOS alerts logged. All trips are safe!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Rider Info</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Ride ID</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Live GPS Location</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Panic Audio Stream</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sosAlerts.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)', verticalAlign: 'middle' }}>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div><strong>{a.user_name}</strong></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.user_phone}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>#{a.ride_id || 'N/A'}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <a href={`https://maps.google.com/?q=${a.lat},${a.lng}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)', textDecoration: 'underline' }}>
                          📍 View on Map ({a.lat ? a.lat.toFixed(4) : '23.0225'}, {a.lng ? a.lng.toFixed(4) : '72.5714'})
                        </a>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {a.audio_url ? (
                          <audio controls src={a.audio_url} style={{ height: '32px', width: '180px' }} />
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No audio stream recorded</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <Badge status={a.status === 'active' ? 'cancelled' : 'completed'}>{a.status.toUpperCase()}</Badge>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {a.status === 'active' && (
                          <Button variant="outline" size="small" onClick={() => handleResolveSos(a.id)}>
                            Resolve Alert
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
