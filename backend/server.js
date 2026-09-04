require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const { setupSocket } = require('./socket');

const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const parcelRoutes = require('./routes/parcelRoutes');
const poolingRoutes = require('./routes/poolingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const trackingRoutes = require('./routes/trackingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const driverRoutes = require('./routes/driverRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const sosRoutes = require('./routes/sosRoutes');
const commuteRoutes = require('./routes/commuteRoutes');
const path = require('path');

const app = express();

const pool = require('./config/db');
async function runMigrations() {
  try {
    console.log('Running database migrations...');
    const [cols] = await pool.query("SHOW COLUMNS FROM rides LIKE 'scheduled_at'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE rides ADD COLUMN scheduled_at TIMESTAMP NULL DEFAULT NULL");
      console.log("Migration: Added scheduled_at column to rides table.");
    }
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ride_chats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ride_id INT NOT NULL,
        sender_id INT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Migration: Ensured ride_chats table exists.");

    const [kycCol] = await pool.query("SHOW COLUMNS FROM drivers LIKE 'kyc_status'");
    if (kycCol.length === 0) {
      await pool.query(`
        ALTER TABLE drivers 
        ADD COLUMN kyc_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified',
        ADD COLUMN license_url TEXT DEFAULT NULL,
        ADD COLUMN rc_url TEXT DEFAULT NULL,
        ADD COLUMN insurance_url TEXT DEFAULT NULL,
        ADD COLUMN ocr_name VARCHAR(100) DEFAULT NULL,
        ADD COLUMN ocr_license_number VARCHAR(50) DEFAULT NULL,
        ADD COLUMN ocr_expiry_date DATE DEFAULT NULL
      `);
      console.log("Migration: Added KYC columns to drivers table.");
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS driver_settlements (
        id INT PRIMARY KEY AUTO_INCREMENT,
        driver_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'processed', 'failed') DEFAULT 'processed',
        bank_reference VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
      )
    `);
    console.log("Migration: Ensured driver_settlements table exists.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS parcel_stops (
        id INT PRIMARY KEY AUTO_INCREMENT,
        parcel_id INT NOT NULL,
        stop_order INT NOT NULL DEFAULT 1,
        address VARCHAR(255) NOT NULL,
        lat DOUBLE NOT NULL,
        lng DOUBLE NOT NULL,
        recipient_name VARCHAR(100) NOT NULL,
        recipient_phone VARCHAR(20) NOT NULL,
        status ENUM('pending', 'completed') DEFAULT 'pending',
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (parcel_id) REFERENCES parcels(id) ON DELETE CASCADE
      )
    `);
    console.log("Migration: Ensured parcel_stops table exists.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        relation VARCHAR(50) DEFAULT 'Emergency Contact',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Migration: Ensured emergency_contacts table exists.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sos_alerts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        ride_id INT DEFAULT NULL,
        lat DOUBLE NOT NULL,
        lng DOUBLE NOT NULL,
        audio_url TEXT DEFAULT NULL,
        status ENUM('active', 'resolved') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Migration: Ensured sos_alerts table exists.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS commute_passes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        pickup_address VARCHAR(255) NOT NULL,
        drop_address VARCHAR(255) NOT NULL,
        pass_type ENUM('weekly', 'monthly') NOT NULL,
        total_trips INT NOT NULL DEFAULT 10,
        trips_remaining INT NOT NULL DEFAULT 10,
        fare_per_trip DECIMAL(10,2) NOT NULL,
        expires_at DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Migration: Ensured commute_passes table exists.");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS corporate_accounts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT UNIQUE NOT NULL,
        company_name VARCHAR(100) NOT NULL,
        gst_number VARCHAR(50) NOT NULL,
        company_email VARCHAR(100) NOT NULL,
        billing_address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("Migration: Ensured corporate_accounts table exists.");

    const [evCol] = await pool.query("SHOW COLUMNS FROM drivers LIKE 'is_ev'");
    if (evCol.length === 0) {
      await pool.query("ALTER TABLE drivers ADD COLUMN is_ev TINYINT(1) DEFAULT 0");
      console.log("Migration: Added is_ev column to drivers table.");
    }

    const [co2Col] = await pool.query("SHOW COLUMNS FROM users LIKE 'total_co2_saved_kg'");
    if (co2Col.length === 0) {
      await pool.query("ALTER TABLE users ADD COLUMN total_co2_saved_kg DECIMAL(10,2) DEFAULT 0.00, ADD COLUMN is_corporate TINYINT(1) DEFAULT 0");
      console.log("Migration: Added total_co2_saved_kg column to users table.");
    }

    const [rideEvCol] = await pool.query("SHOW COLUMNS FROM rides LIKE 'is_ev'");
    if (rideEvCol.length === 0) {
      await pool.query("ALTER TABLE rides ADD COLUMN is_ev TINYINT(1) DEFAULT 0, ADD COLUMN is_corporate TINYINT(1) DEFAULT 0, ADD COLUMN co2_saved_kg DECIMAL(10,2) DEFAULT 0.00, ADD COLUMN commute_pass_id INT DEFAULT NULL");
      console.log("Migration: Added EV and CO2 columns to rides table.");
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ride_bids (
        id INT PRIMARY KEY AUTO_INCREMENT,
        ride_id INT NOT NULL,
        driver_id INT NOT NULL,
        bid_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
        FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
      )
    `);
    console.log("Migration: Ensured ride_bids table exists.");

    const [fuelCol] = await pool.query("SHOW COLUMNS FROM drivers LIKE 'fuel_cashback_balance'");
    if (fuelCol.length === 0) {
      await pool.query("ALTER TABLE drivers ADD COLUMN fuel_cashback_balance DECIMAL(10,2) DEFAULT 0.00, ADD COLUMN completed_trips_streak INT DEFAULT 0");
      console.log("Migration: Added fuel_cashback_balance column to drivers table.");
    }

    const [offeredFareCol] = await pool.query("SHOW COLUMNS FROM rides LIKE 'offered_fare'");
    if (offeredFareCol.length === 0) {
      await pool.query("ALTER TABLE rides ADD COLUMN offered_fare DECIMAL(10,2) DEFAULT NULL, ADD COLUMN is_multimodal TINYINT(1) DEFAULT 0");
      console.log("Migration: Added offered_fare and is_multimodal columns to rides table.");
    }
  } catch (err) {
    console.error("Migration error:", err.message);
  }
}
runMigrations();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/parcels', parcelRoutes);
app.use('/api/pooling', poolingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/commute', commuteRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true, message: 'Tripzy API' }));
app.use(errorHandler);

setupSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Tripzy backend running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready`);

  // Auto-seed database at startup (updates demo accounts in cloud DB)
  try {
    const { seedDemoData } = require('./scripts/seedDemoData');
    seedDemoData(false)
      .then(() => console.log('Database auto-seeded successfully.'))
      .catch((err) => console.error('Database auto-seed error:', err));
  } catch (err) {
    console.error('Failed to load auto-seeding module:', err);
  }

  // Start Scheduled Rides Auto-Dispatcher (runs every 60 seconds)
  try {
    const { checkScheduledRides } = require('./controllers/ridesController');
    setInterval(async () => {
      await checkScheduledRides();
    }, 60000);
    console.log('Auto-Dispatcher worker initialized.');
  } catch (dispatcherErr) {
    console.error('Failed to initialize Auto-Dispatcher:', dispatcherErr.message);
  }
});
