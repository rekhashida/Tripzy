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

const app = express();
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

app.get('/api/health', (req, res) => res.json({ ok: true, message: 'Tripzy API' }));
app.use(errorHandler);

setupSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Tripzy backend running on http://localhost:${PORT}`);
  console.log(`WebSocket server ready`);
});
