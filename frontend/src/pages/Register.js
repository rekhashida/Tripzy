import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiPhone, FiLock, FiUserPlus, FiTruck } from 'react-icons/fi';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('user');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('sedan');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        phone,
        role,
        ...(role === 'driver' && { 
          license_number: licenseNumber, 
          vehicle_type: vehicleType, 
          vehicle_number: vehicleNumber 
        })
      });
      navigate('/');
    } catch (res) {
      setErr(res.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <Card>
        <div className="text-center mb-4">
          <h1 className="card-title">Create Your Account</h1>
          <p className="card-subtitle">Join Tripzy to book rides and send parcels</p>
        </div>

        {err && (
          <div className="alert alert-error">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
            autoComplete="name"
          />

          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            autoComplete="email"
          />

          <Input
            type="tel"
            label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter your phone number"
            required
            autoComplete="tel"
          />

          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            required
            autoComplete="new-password"
          />

          <Select
            label="Account Type"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'user', label: 'User (Book rides & send parcels)' },
              { value: 'driver', label: 'Driver (Provide rides & deliveries)' },
              { value: 'admin', label: 'Admin (Manage platform)' }
            ]}
          />

          {role === 'driver' && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1.5rem', 
              background: 'var(--bg-tertiary)', 
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiTruck /> Driver Information
              </h3>
              
              <Input
                label="License Number"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Enter your driving license number"
                required={role === 'driver'}
              />

              <Select
                label="Vehicle Type"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                options={[
                  { value: 'hatchback', label: 'Hatchback' },
                  { value: 'sedan', label: 'Sedan' },
                  { value: 'suv', label: 'SUV' },
                  { value: 'bike', label: 'Bike' }
                ]}
              />

              <Input
                label="Vehicle Number"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. GJ01AB1234"
                required={role === 'driver'}
              />
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
            style={{ marginTop: '1.5rem' }}
          >
            {loading ? 'Creating account...' : (
              <>
                <FiUserPlus /> Create Account
              </>
            )}
          </Button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
            Sign in here
          </Link>
        </p>
      </Card>
    </div>
  );
}
