import React, { useState, useEffect } from 'react';
import { FiUsers, FiTruck, FiNavigation, FiPackage, FiDollarSign, FiTrendingUp, FiShield } from 'react-icons/fi';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import Card from '../components/Card';
import Loading from '../components/Loading';
import Badge from '../components/Badge';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [rides, setRides] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, usersRes, ridesRes, parcelsRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: null })),
        api.get('/admin/users').catch(() => ({ data: [] })),
        api.get('/admin/rides').catch(() => ({ data: [] })),
        api.get('/admin/parcels').catch(() => ({ data: [] }))
      ]);
      
      setStats(statsRes.data);
      setUsers(usersRes.data || []);
      setRides(ridesRes.data || []);
      setParcels(parcelsRes.data || []);
    } catch (e) {
      console.error('Failed to load admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Loading admin dashboard..." />;
  }

  // Prepare chart data
  const rideStatusData = rides.reduce((acc, ride) => {
    acc[ride.status] = (acc[ride.status] || 0) + 1;
    return acc;
  }, {});

  const rideStatusChart = Object.entries(rideStatusData).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value
  }));

  const parcelStatusData = parcels.reduce((acc, parcel) => {
    acc[parcel.status] = (acc[parcel.status] || 0) + 1;
    return acc;
  }, {});

  const parcelStatusChart = Object.entries(parcelStatusData).map(([name, value]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    value
  }));

  const userRoleData = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const userRoleChart = Object.entries(userRoleData).map(([name, value]) => ({
    name: name.toUpperCase(),
    value
  }));

  // Recent activity data
  const recentRides = rides.slice(0, 10);
  const recentParcels = parcels.slice(0, 10);

  return (
    <>
      <Card>
        <h1 className="card-title">
          <FiShield style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Admin Dashboard
        </h1>
        <p className="card-subtitle">Overview of platform statistics and activities</p>
      </Card>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">
              <FiUsers style={{ fontSize: '1.5rem', display: 'inline', marginRight: '0.5rem' }} />
              {stats.users || 0}
            </div>
            <div className="stat-label">Total Users</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">
              <FiTruck style={{ fontSize: '1.5rem', display: 'inline', marginRight: '0.5rem' }} />
              {stats.drivers || 0}
            </div>
            <div className="stat-label">Active Drivers</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">
              <FiNavigation style={{ fontSize: '1.5rem', display: 'inline', marginRight: '0.5rem' }} />
              {stats.completedRides || 0}
            </div>
            <div className="stat-label">Completed Rides</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">
              <FiPackage style={{ fontSize: '1.5rem', display: 'inline', marginRight: '0.5rem' }} />
              {stats.deliveredParcels || 0}
            </div>
            <div className="stat-label">Delivered Parcels</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">
              <FiDollarSign style={{ fontSize: '1.5rem', display: 'inline', marginRight: '0.5rem' }} />
              ₹{stats.totalRevenue || 0}
            </div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {rideStatusChart.length > 0 && (
          <Card>
            <h3 className="card-title" style={{ fontSize: '1.25rem' }}>Ride Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={rideStatusChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {rideStatusChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {parcelStatusChart.length > 0 && (
          <Card>
            <h3 className="card-title" style={{ fontSize: '1.25rem' }}>Parcel Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={parcelStatusChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {parcelStatusChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {userRoleChart.length > 0 && (
          <Card>
            <h3 className="card-title" style={{ fontSize: '1.25rem' }}>User Roles</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userRoleChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius)'
                  }}
                />
                <Bar dataKey="value" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      <Card style={{ marginBottom: '1.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
        <h3 className="card-title" style={{ fontSize: '1.25rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📢 Marketing & User Engagement Campaigns
        </h3>
        <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>
          Scan the database for registered riders who have been inactive for more than a week, and automatically send them a personalized SMS nudge.
        </p>
        
        {campaignMsg && (
          <div className={`alert alert-${campaignMsgType}`} style={{ marginBottom: '1rem' }}>
            {campaignMsg}
          </div>
        )}

        <button 
          className="btn btn-primary"
          onClick={triggerSmsCampaign}
          disabled={campaignLoading}
        >
          {campaignLoading ? 'Sending Reminders...' : 'Trigger Inactivity SMS Reminders'}
        </button>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '1.5rem' }}>
        <Card>
          <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            Recent Users ({users.length})
          </h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {users.slice(0, 20).map((user) => (
              <div key={user.id} className="list-item" style={{ marginBottom: '0.75rem' }}>
                <div className="list-item-content">
                  <div className="list-item-title">{user.name}</div>
                  <div className="list-item-subtitle">
                    {user.email} | {user.phone}
                  </div>
                </div>
                <Badge status={user.role}>{user.role}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            Recent Rides ({rides.length})
          </h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {recentRides.map((ride) => (
              <div key={ride.id} className="list-item" style={{ marginBottom: '0.75rem' }}>
                <div className="list-item-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600 }}>#{ride.id}</span>
                    <Badge status={ride.status}>{ride.status}</Badge>
                  </div>
                  <div className="list-item-subtitle">
                    {ride.user_name} | ₹{ride.fare} | {ride.pickup_address?.substring(0, 30)}...
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
            Recent Parcels ({parcels.length})
          </h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {recentParcels.map((parcel) => (
              <div key={parcel.id} className="list-item" style={{ marginBottom: '0.75rem' }}>
                <div className="list-item-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600 }}>#{parcel.id}</span>
                    <Badge status={parcel.status}>{parcel.status}</Badge>
                  </div>
                  <div className="list-item-subtitle">
                    {parcel.recipient_name} | ₹{parcel.fare} | {parcel.weight_kg}kg
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
