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
  } catch (err) {
    console.error("Migration error:", err.message);
  }
}
runMigrations();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

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
