import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiTruck, FiPackage, FiMapPin, FiDollarSign, FiUser, FiBox } from 'react-icons/fi';
import api from '../services/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Loading from '../components/Loading';

export default function MyParcels() {
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadParcels();
  }, []);

  const loadParcels = async () => {
    try {
      const { data } = await api.get('/parcels/my');
      setParcels(data || []);
    } catch (e) {
      setParcels([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredParcels = filter === 'all' 
    ? parcels 
    : parcels.filter(parcel => parcel.status === filter);

  if (loading) {
    return <Loading message="Loading your parcels..." />;
  }

  return (
    <>
      <Card>
        <div className="card-header">
          <h1 className="card-title">
            <FiTruck style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            My Parcels
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
              variant={filter === 'in_transit' ? 'primary' : 'outline'}
              onClick={() => setFilter('in_transit')}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              In Transit
            </Button>
            <Button
              variant={filter === 'delivered' ? 'primary' : 'outline'}
              onClick={() => setFilter('delivered')}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              Delivered
            </Button>
          </div>
        </div>

        {parcels.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem', color: 'var(--text-muted)' }}>
            <FiPackage style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No parcels yet</p>
            <Link to="/parcel">
              <Button variant="primary">Send Your First Parcel</Button>
            </Link>
          </div>
        ) : filteredParcels.length === 0 ? (
          <div className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
            <p>No parcels found with this filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredParcels.map((parcel) => (
              <div key={parcel.id} className="list-item">
                <div className="list-item-content" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>#{parcel.id}</span>
                    <Badge status={parcel.status}>{parcel.status}</Badge>
                  </div>
                  
                  <div className="list-item-title" style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <FiMapPin style={{ color: 'var(--success)', marginTop: '0.25rem' }} />
                      <span>{parcel.pickup_address || 'Pickup location'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <FiMapPin style={{ color: 'var(--danger)', marginTop: '0.25rem' }} />
                      <span>{parcel.drop_address || 'Delivery location'}</span>
                    </div>
                  </div>

                  <div className="list-item-subtitle" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {parcel.fare && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiDollarSign /> ₹{parcel.fare}
                      </span>
                    )}
                    {parcel.weight_kg && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiBox /> {parcel.weight_kg} kg
                      </span>
                    )}
                    {parcel.recipient_name && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiUser /> {parcel.recipient_name}
                      </span>
                    )}
                    {parcel.recipient_phone && (
                      <span>{parcel.recipient_phone}</span>
                    )}
                  </div>

                  {parcel.created_at && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Created on {new Date(parcel.created_at).toLocaleString()}
                    </div>
                  )}

                  {(parcel.pickup_otp || parcel.drop_otp) && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)', fontSize: '0.85rem' }}>
                      {parcel.pickup_otp && (
                        <div style={{ marginBottom: '0.25rem' }}>
                          <strong>Pickup OTP:</strong> {parcel.pickup_otp}
                        </div>
                      )}
                      {parcel.drop_otp && (
                        <div>
                          <strong>Drop OTP:</strong> {parcel.drop_otp}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(parcel.status === 'in_transit' || parcel.status === 'picked_up') && (
                    <Link to={`/tracking/${parcel.id}`}>
                      <Button variant="primary" style={{ whiteSpace: 'nowrap' }}>
                        <FiTruck /> Track
                      </Button>
                    </Link>
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
