-- Tripzy - MySQL Database Schema
-- Run this in MySQL to create all tables

CREATE DATABASE IF NOT EXISTS tripzy_db;
USE tripzy_db;

-- Users table (riders/customers)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  role ENUM('user', 'driver', 'admin') DEFAULT 'user',
  wallet_balance DECIMAL(10,2) DEFAULT 500.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Drivers table (extends user info)
CREATE TABLE drivers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  license_number VARCHAR(50),
  vehicle_type ENUM('hatchback', 'sedan', 'suv', 'bike', 'auto') NOT NULL,
  vehicle_number VARCHAR(20),
  is_online BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3,2) DEFAULT 5.00,
  total_trips INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Driver locations (for matching - can use Redis in production)
CREATE TABLE driver_locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  driver_id INT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
);

-- Rides table
CREATE TABLE rides (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  driver_id INT,
  pickup_lat DECIMAL(10,8) NOT NULL,
  pickup_lng DECIMAL(11,8) NOT NULL,
  drop_lat DECIMAL(10,8) NOT NULL,
  drop_lng DECIMAL(11,8) NOT NULL,
  pickup_address TEXT,
  drop_address TEXT,
  distance_km DECIMAL(6,2),
  duration_min INT,
  fare DECIMAL(10,2),
  status ENUM('pending', 'driver_assigned', 'otp_verified', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  vehicle_type ENUM('hatchback', 'sedan', 'suv', 'bike', 'auto'),
  luggage_size ENUM('small', 'medium', 'large'),
  is_pooling BOOLEAN DEFAULT FALSE,
  pickup_otp VARCHAR(6),
  drop_otp VARCHAR(6),
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

-- Parcel deliveries
CREATE TABLE parcels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  driver_id INT,
  pickup_lat DECIMAL(10,8) NOT NULL,
  pickup_lng DECIMAL(11,8) NOT NULL,
  drop_lat DECIMAL(10,8) NOT NULL,
  drop_lng DECIMAL(11,8) NOT NULL,
  pickup_address TEXT,
  drop_address TEXT,
  recipient_name VARCHAR(100),
  recipient_phone VARCHAR(20),
  weight_kg DECIMAL(4,2) DEFAULT 1.00,
  fare DECIMAL(10,2),
  status ENUM('pending', 'driver_assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled') DEFAULT 'pending',
  pickup_otp VARCHAR(6),
  drop_otp VARCHAR(6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

-- Ride pooling (shared rides)
CREATE TABLE ride_pools (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ride_id INT NOT NULL,
  user_id INT NOT NULL,
  pickup_lat DECIMAL(10,8),
  pickup_lng DECIMAL(11,8),
  drop_lat DECIMAL(10,8),
  drop_lng DECIMAL(11,8),
  fare_share DECIMAL(10,2),
  status ENUM('pending', 'joined', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES rides(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Payments (Razorpay)
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  ride_id INT,
  parcel_id INT,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (ride_id) REFERENCES rides(id),
  FOREIGN KEY (parcel_id) REFERENCES parcels(id)
);

-- Ratings
CREATE TABLE ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ride_id INT,
  parcel_id INT,
  user_id INT NOT NULL,
  driver_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ride_id) REFERENCES rides(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

-- OTP store (for verification - Redis preferred in production)
CREATE TABLE otp_store (
  id INT PRIMARY KEY AUTO_INCREMENT,
  phone_or_email VARCHAR(150) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  purpose ENUM('login', 'pickup', 'drop', 'parcel_pickup', 'parcel_drop') NOT NULL,
  reference_id INT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_rides_user ON rides(user_id);
CREATE INDEX idx_rides_driver ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_drivers_online ON drivers(is_online, is_available);
CREATE INDEX idx_driver_locations_driver ON driver_locations(driver_id);
CREATE INDEX idx_parcels_user ON parcels(user_id);
CREATE INDEX idx_parcels_status ON parcels(status);
