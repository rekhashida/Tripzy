import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMap, FiNavigation, FiClock, FiDollarSign, FiUser, FiMapPin } from 'react-icons/fi';
import api from '../services/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Loading from '../components/Loading';

export default function MyRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      const { data } = await api.get('/rides/my');
      setRides(data || []);
    } catch (e) {
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRides = filter === 'all' 
    ? rides 
    : rides.filter(ride => ride.status === filter);

  if (loading) {
    return <Loading message="Loading your rides..." />;
  }

  const printGstInvoice = (ride) => {
    const gstRate = 0.05;
    const fare = parseFloat(ride.fare || 0);
    const baseFare = (fare / (1 + gstRate)).toFixed(2);
    const gstAmount = (fare - baseFare).toFixed(2);

    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Tripzy GST Tax Invoice - Ride #${ride.id}</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f4c9c; padding-bottom: 1rem; }
            .title { font-size: 1.5rem; font-weight: bold; color: #0f4c9c; }
            .table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
            .table th, .table td { border: 1px solid #cbd5e1; padding: 0.75rem; text-align: left; }
            .table th { background: #f1f5f9; }
            .footer { margin-top: 2rem; font-size: 0.85rem; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">🚕 Tripzy Mobility Solutions</div>
              <div>GSTIN: 24AAACT9999Z1Z5 | SAC Code: 996412</div>
              <div>Official Tax Invoice / Bill of Supply</div>
            </div>
            <div style="text-align: right;">
              <h3>Invoice #${ride.id}</h3>
              <div>Date: ${new Date(ride.created_at || Date.now()).toLocaleDateString()}</div>
            </div>
          </div>
          <div style="margin-top: 1.5rem;">
            <strong>Pickup:</strong> ${ride.pickup_address || `${ride.pickup_lat}, ${ride.pickup_lng}`}<br/>
            <strong>Drop:</strong> ${ride.drop_address || `${ride.drop_lat}, ${ride.drop_lng}`}<br/>
            <strong>Vehicle:</strong> ${ride.vehicle_type ? ride.vehicle_type.toUpperCase() : 'Standard Taxi'}
          </div>
          <table class="table">
            <thead>
              <tr><th>Description</th><th>Base Fare</th><th>GST (5%)</th><th>Total Amount</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>Passenger Ride Services (Ride #${ride.id})</td>
                <td>₹${baseFare}</td>
                <td>₹${gstAmount}</td>
                <td><strong>₹${fare.toFixed(2)}</strong></td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            Thank you for riding with Tripzy! This is a computer-generated tax invoice.
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <>
      <Card>
        <div className="card-header">
          <h1 className="card-title">
            <FiMap style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            My Rides
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilter('all')}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              All
            </Button>
            <Button
              variant={filter === 'pending' ? 'primary' : 'outline'}
              onClick={() => setFilter('pending')}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'in_progress' ? 'primary' : 'outline'}
              onClick={() => setFilter('in_progress')}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              In Progress
            </Button>
            <Button
              variant={filter === 'completed' ? 'primary' : 'outline'}
              onClick={() => setFilter('completed')}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Completed
            </Button>
          </div>
        </div>

        {rides.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
            <FiNavigation style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No rides yet</p>
            <Link to="/ride">
              <Button variant="primary">Book Your First Ride</Button>
            </Link>
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
            <p>No rides found with this filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredRides.map((ride) => (
              <div key={ride.id} className="list-item">
                <div className="list-item-content" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>#{ride.id}</span>
                    <Badge status={ride.status}>{ride.status}</Badge>
                    {ride.vehicle_type && (
                      <Badge status="in_progress">{ride.vehicle_type}</Badge>
                    )}
                    {ride.is_ev === 1 && (
                      <Badge status="completed">🌿 EV Ride</Badge>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--success)' }}>●</span>
                      <span style={{ fontSize: '0.9rem' }}>{ride.pickup_address || `${ride.pickup_lat}, ${ride.pickup_lng}`}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--danger)' }}>●</span>
                      <span style={{ fontSize: '0.9rem' }}>{ride.drop_address || `${ride.drop_lat}, ${ride.drop_lng}`}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                    {ride.fare && (
                      <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                        <FiDollarSign style={{ display: 'inline' }} /> ₹{ride.fare}
                      </span>
                    )}
                    {ride.distance_km && (
                      <span>{ride.distance_km} km</span>
                    )}
                    {ride.duration_min && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiClock /> {ride.duration_min} min
                      </span>
                    )}
                    {ride.driver_name && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiUser /> {ride.driver_name}
                      </span>
                    )}
                  </div>

                  {ride.created_at && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Booked on {new Date(ride.created_at).toLocaleString()}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(ride.status === 'in_progress' || ride.status === 'driver_assigned' || ride.status === 'otp_verified') && (
                    <Link to={`/tracking/${ride.id}`}>
                      <Button variant="primary" style={{ whiteSpace: 'nowrap' }}>
                        <FiMap /> Track
                      </Button>
                    </Link>
                  )}
                  {ride.status === 'completed' && (
                    <>
                      <Link to={`/tracking/${ride.id}`}>
                        <Button variant="outline" style={{ whiteSpace: 'nowrap' }}>
                          View Details
                        </Button>
                      </Link>
                      <Button variant="outline" onClick={() => printGstInvoice(ride)} style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                        GST Invoice 📄
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
