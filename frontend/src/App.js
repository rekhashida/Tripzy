import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Nav from './components/Nav';
import Login from './pages/Login';
import Register from './pages/Register';
import RideBooking from './pages/RideBooking';
import ParcelDelivery from './pages/ParcelDelivery';
import VoiceBooking from './pages/VoiceBooking';
import RidePooling from './pages/RidePooling';
import RealTimeTracking from './pages/RealTimeTracking';
import MyRides from './pages/MyRides';
import MyParcels from './pages/MyParcels';
import AdminDashboard from './pages/AdminDashboard';
import DriverDashboard from './pages/DriverDashboard';
import Home from './pages/Home';
import SupportChatbot from './components/SupportChatbot';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function RoleRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Nav />
          <div className="app">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/ride" element={<PrivateRoute><RideBooking /></PrivateRoute>} />
              <Route path="/parcel" element={<PrivateRoute><ParcelDelivery /></PrivateRoute>} />
              <Route path="/voice" element={<PrivateRoute><VoiceBooking /></PrivateRoute>} />
              <Route path="/pooling" element={<PrivateRoute><RidePooling /></PrivateRoute>} />
              <Route path="/tracking/:rideId" element={<PrivateRoute><RealTimeTracking /></PrivateRoute>} />
              <Route path="/my-rides" element={<PrivateRoute><MyRides /></PrivateRoute>} />
              <Route path="/my-parcels" element={<PrivateRoute><MyParcels /></PrivateRoute>} />
              <Route path="/admin" element={<RoleRoute roles={["admin"]}><AdminDashboard /></RoleRoute>} />
              <Route path="/driver" element={<RoleRoute roles={["driver"]}><DriverDashboard /></RoleRoute>} />
            </Routes>
          </div>
          <SupportChatbot />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
