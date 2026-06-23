import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiHome, 
  FiNavigation, 
  FiPackage, 
  FiUsers, 
  FiMic, 
  FiMap, 
  FiTruck,
  FiShield,
  FiLogOut,
  FiUser
} from 'react-icons/fi';

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="nav">
      <div className="brand">
        <FiNavigation style={{ fontSize: '1.5rem' }} />
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Tripzy</NavLink>
      </div>
      
      {user && (
        <div className="nav-links">
          <NavLink to="/ride" className={({ isActive }) => isActive ? 'active' : ''}>
            <FiNavigation /> Ride
          </NavLink>
          <NavLink to="/parcel" className={({ isActive }) => isActive ? 'active' : ''}>
            <FiPackage /> Parcel
          </NavLink>
          <NavLink to="/pooling" className={({ isActive }) => isActive ? 'active' : ''}>
            <FiUsers /> Pooling
          </NavLink>
          <NavLink to="/voice" className={({ isActive }) => isActive ? 'active' : ''}>
            <FiMic /> Voice
          </NavLink>
        </div>
      )}
      
      <div className="spacer" />
      
      <div className="nav-links">
        {user ? (
          <>
            <NavLink to="/my-rides" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiMap /> My Rides
            </NavLink>
            <NavLink to="/my-parcels" className={({ isActive }) => isActive ? 'active' : ''}>
              <FiTruck /> My Parcels
            </NavLink>
            {user.role === 'driver' && (
              <NavLink to="/driver" className={({ isActive }) => isActive ? 'active' : ''}>
                <FiTruck /> Driver
              </NavLink>
            )}
            {user.role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                <FiShield /> Admin
              </NavLink>
            )}
            <div className="username">
              <FiUser /> {user.name}
            </div>
            <button className="btn btn-outline" onClick={handleLogout}>
              <FiLogOut /> Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : ''}>Login</NavLink>
            <NavLink to="/register" className={({ isActive }) => (isActive ? 'active ' : '') + 'btn btn-primary'}>Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
