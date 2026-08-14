// WebSocket: broadcast driver GPS to users tracking that ride + driver notifications
let ioInstance = null;

function setupSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    socket.on('join-ride', (rideId) => {
      socket.join(`ride:${rideId}`);
    });

    socket.on('leave-ride', (rideId) => {
      socket.leave(`ride:${rideId}`);
    });

    socket.on('driver-connect', (payload) => {
      const driverId = payload?.driverId;
      if (driverId) {
        socket.join(`driver:${driverId}`);
      }
    });

    socket.on('driver-location', (data) => {
      const { rideId, latitude, longitude } = data;
      io.to(`ride:${rideId}`).emit('location-update', { latitude, longitude, at: new Date().toISOString() });
    });

    socket.on('send-message', async (data) => {
      const { rideId, senderId, senderName, message } = data;
      try {
        const pool = require('../config/db');
        const [result] = await pool.query(
          'INSERT INTO ride_chats (ride_id, sender_id, message) VALUES (?, ?, ?)',
          [rideId, senderId, message]
        );
        io.to(`ride:${rideId}`).emit('new-message', {
          id: result.insertId,
          rideId,
          senderId,
          senderName,
          message,
          created_at: new Date().toISOString(),
          read: false
        });
      } catch (err) {
        console.error('Socket send-message failed:', err.message);
      }
    });

    socket.on('message-read', (data) => {
      const { rideId, messageId } = data;
      io.to(`ride:${rideId}`).emit('message-read-receipt', { messageId, rideId });
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

function getIo() {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
}

function emitToDriver(driverId, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(`driver:${driverId}`).emit(event, payload);
}

function emitStatusUpdate(rideId, status, extra = {}) {
  if (!ioInstance) return;
  ioInstance.to(`ride:${rideId}`).emit('status-update', { status, ...extra });
}

module.exports = { setupSocket, getIo, emitToDriver, emitStatusUpdate };
