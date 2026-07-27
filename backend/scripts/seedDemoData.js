const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: 'd:/tripzy/backend/.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Rekha05',
  database: process.env.DB_NAME || 'tripzy_db',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

async function run() {
  try {
    console.log('Connecting to database...');
    const passwordHash = await bcrypt.hash('TripzyDemoSecuredPass2026!', 10);

    // 1. Seed Users
    const users = [
      { name: 'Tripzy Admin', email: 'admin@tripzy.com', password: passwordHash, phone: '9999999999', role: 'admin', wallet_balance: 5000.00 },
      { name: 'Rajesh Kumar', email: 'driver@tripzy.com', password: passwordHash, phone: '8888888888', role: 'driver', wallet_balance: 1000.00 },
      { name: 'Somabhai Rickshawala', email: 'auto_driver@tripzy.com', password: passwordHash, phone: '7777777777', role: 'driver', wallet_balance: 1000.00 },
      { name: 'Amit Sharma', email: 'rider@tripzy.com', password: passwordHash, phone: '9876543210', role: 'user', wallet_balance: 1250.00 },
      { name: 'Priya Patel', email: 'priya@tripzy.com', password: passwordHash, phone: '9123456780', role: 'user', wallet_balance: 600.00 },
      { name: 'Rahul Mehta', email: 'rahul@tripzy.com', password: passwordHash, phone: '9123456781', role: 'user', wallet_balance: 450.00 },
      { name: 'Sneha Reddy', email: 'sneha@tripzy.com', password: passwordHash, phone: '9123456782', role: 'user', wallet_balance: 800.00 }
    ];

    console.log('Seeding users...');
    const userIds = {};
    for (const u of users) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [u.email]);
      if (existing.length > 0) {
        userIds[u.email] = existing[0].id;
        await pool.query('UPDATE users SET name = ?, password = ?, phone = ?, role = ?, wallet_balance = ? WHERE id = ?', [u.name, u.password, u.phone, u.role, u.wallet_balance, existing[0].id]);
        console.log(`Updated user: ${u.email}`);
      } else {
        const [result] = await pool.query(
          'INSERT INTO users (name, email, password, phone, role, wallet_balance) VALUES (?, ?, ?, ?, ?, ?)',
          [u.name, u.email, u.password, u.phone, u.role, u.wallet_balance]
        );
        userIds[u.email] = result.insertId;
        console.log(`Created user: ${u.email}`);
      }
    }

    // 2. Seed Drivers Profiles
    const drivers = [
      { email: 'driver@tripzy.com', license_number: 'DL-14S20261234', vehicle_type: 'sedan', vehicle_number: 'DL-1CA-1234', rating: 4.8 },
      { email: 'auto_driver@tripzy.com', license_number: 'GJ-01A-2026567', vehicle_type: 'auto', vehicle_number: 'GJ-01-XX-9999', rating: 4.9 }
    ];

    console.log('Seeding driver profiles...');
    const driverIds = {};
    for (const d of drivers) {
      const userId = userIds[d.email];
      const [existing] = await pool.query('SELECT id FROM drivers WHERE user_id = ?', [userId]);
      if (existing.length > 0) {
        driverIds[d.email] = existing[0].id;
        await pool.query(
          'UPDATE drivers SET license_number = ?, vehicle_type = ?, vehicle_number = ?, rating = ?, is_available = 1 WHERE user_id = ?',
          [d.license_number, d.vehicle_type, d.vehicle_number, d.rating, userId]
        );
        console.log(`Updated driver profile for: ${d.email}`);
      } else {
        const [result] = await pool.query(
          'INSERT INTO drivers (user_id, license_number, vehicle_type, vehicle_number, rating, is_available) VALUES (?, ?, ?, ?, ?, 1)',
          [userId, d.license_number, d.vehicle_type, d.vehicle_number, d.rating]
        );
        driverIds[d.email] = result.insertId;
        console.log(`Created driver profile for: ${d.email}`);
      }
    }

    // 3. Seed Past completed Rides & Parcels to make DB look alive
    const riderId = userIds['rider@tripzy.com'];
    const sedanDriverId = driverIds['driver@tripzy.com'];
    const autoDriverId = driverIds['auto_driver@tripzy.com'];

    console.log('Cleaning and seeding past trips for rider...');
    // Seed some finished rides
    const mockRides = [
      { user_id: riderId, driver_id: sedanDriverId, pickup_lat: 23.0225, pickup_lng: 72.5714, drop_lat: 23.0331, drop_lng: 72.5621, pickup_address: 'Income Tax Circle, Ahmedabad', drop_address: 'C.G. Road, Ahmedabad', distance_km: 4.2, duration_min: 12, fare: 95.00, vehicle_type: 'sedan', status: 'completed' },
      { user_id: riderId, driver_id: autoDriverId, pickup_lat: 23.0225, pickup_lng: 72.5714, drop_lat: 23.0123, drop_lng: 72.5512, pickup_address: 'Income Tax Circle, Ahmedabad', drop_address: 'Prahlad Nagar, Ahmedabad', distance_km: 6.8, duration_min: 18, fare: 110.00, vehicle_type: 'auto', status: 'completed' }
    ];

    for (const r of mockRides) {
      const [ex] = await pool.query('SELECT id FROM rides WHERE user_id = ? AND pickup_address = ? AND drop_address = ? LIMIT 1', [r.user_id, r.pickup_address, r.drop_address]);
      if (ex.length === 0) {
        await pool.query(
          `INSERT INTO rides (user_id, driver_id, pickup_lat, pickup_lng, drop_lat, drop_lng, pickup_address, drop_address, distance_km, duration_min, fare, vehicle_type, status, is_pooling)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [r.user_id, r.driver_id, r.pickup_lat, r.pickup_lng, r.drop_lat, r.drop_lng, r.pickup_address, r.drop_address, r.distance_km, r.duration_min, r.fare, r.vehicle_type, r.status]
        );
      }
    }

    // Seed some finished parcels
    const mockParcels = [
      { user_id: riderId, pickup_lat: 23.0225, pickup_lng: 72.5714, drop_lat: 23.0331, drop_lng: 72.5621, pickup_address: 'Income Tax Circle, Ahmedabad', drop_address: 'C.G. Road, Ahmedabad', recipient_name: 'Harsh Patel', recipient_phone: '9898989898', weight_kg: 1.5, fare: 80.00, status: 'delivered', pickup_otp: '1234', drop_otp: '5678' },
      { user_id: riderId, pickup_lat: 23.0225, pickup_lng: 72.5714, drop_lat: 23.0123, drop_lng: 72.5512, pickup_address: 'Income Tax Circle, Ahmedabad', drop_address: 'Prahlad Nagar, Ahmedabad', recipient_name: 'Devang Vyas', recipient_phone: '9797979797', weight_kg: 5.0, fare: 120.00, status: 'in_transit', pickup_otp: '2345', drop_otp: '6789' }
    ];

    for (const p of mockParcels) {
      const [ex] = await pool.query('SELECT id FROM parcels WHERE user_id = ? AND pickup_address = ? AND drop_address = ? LIMIT 1', [p.user_id, p.pickup_address, p.drop_address]);
      if (ex.length === 0) {
        await pool.query(
          `INSERT INTO parcels (user_id, pickup_lat, pickup_lng, drop_lat, drop_lng, pickup_address, drop_address, recipient_name, recipient_phone, weight_kg, fare, status, pickup_otp, drop_otp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.user_id, p.pickup_lat, p.pickup_lng, p.drop_lat, p.drop_lng, p.pickup_address, p.drop_address, p.recipient_name, p.recipient_phone, p.weight_kg, p.fare, p.status, p.pickup_otp, p.drop_otp]
        );
      }
    }

    // Seed some available pools for other users so the page isn't empty!
    const priyaId = userIds['priya@tripzy.com'];
    const rahulId = userIds['rahul@tripzy.com'];

    const mockPools = [
      { user_id: priyaId, pickup_lat: 23.0225, pickup_lng: 72.5714, drop_lat: 23.0331, drop_lng: 72.5621, pickup_address: 'Income Tax Circle, Ahmedabad', drop_address: 'C.G. Road, Ahmedabad', distance_km: 4.2, duration_min: 12, fare: 95.00, vehicle_type: 'sedan', status: 'pending' },
      { user_id: rahulId, pickup_lat: 23.0225, pickup_lng: 72.5714, drop_lat: 23.0543, drop_lng: 72.5876, pickup_address: 'Income Tax Circle, Ahmedabad', drop_address: 'RTO Circle, Ahmedabad', distance_km: 8.5, duration_min: 22, fare: 155.00, vehicle_type: 'auto', status: 'pending' }
    ];

    for (const r of mockPools) {
      const [ex] = await pool.query('SELECT id FROM rides WHERE user_id = ? AND is_pooling = 1 AND status = "pending" LIMIT 1', [r.user_id]);
      if (ex.length === 0) {
        const [res] = await pool.query(
          `INSERT INTO rides (user_id, pickup_lat, pickup_lng, drop_lat, drop_lng, pickup_address, drop_address, distance_km, duration_min, fare, vehicle_type, status, is_pooling)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [r.user_id, r.pickup_lat, r.pickup_lng, r.drop_lat, r.drop_lng, r.pickup_address, r.drop_address, r.distance_km, r.duration_min, r.fare, r.vehicle_type, r.status]
        );
        const rideId = res.insertId;
        // Insert creator into ride_pools
        await pool.query(
          'INSERT INTO ride_pools (ride_id, user_id, pickup_lat, pickup_lng, drop_lat, drop_lng, fare_share, status) VALUES (?, ?, ?, ?, ?, ?, ?, "joined")',
          [rideId, r.user_id, r.pickup_lat, r.pickup_lng, r.drop_lat, r.drop_lng, Math.round(r.fare), 'joined']
        );
      }
    }

    console.log('Seeding successfully completed!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
}

run();
