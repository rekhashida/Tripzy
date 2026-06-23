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

module.exports = { setupSocket, getIo, emitToDriver };
