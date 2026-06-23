// backend/sockets/index.js
const { Server } = require('socket.io');
const redis = require('../config/redis');
const db = require('../config/db');

function initSockets(server) {
  const io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket) => {
    // user wants to watch ride
    socket.on('WATCH_RIDE', (rideId) => {
      socket.join(`ride_${rideId}_user`);
    });

    // driver sends location updates
    socket.on('DRIVER_LOCATION_UPDATE', async (data) => {
      const { ride_id, latitude, longitude, speed, timestamp } = data;

      await redis.set(
        `location:${ride_id}`,
        JSON.stringify({ latitude, longitude, speed, timestamp }),
        { EX: 300 }
      );

      const [rows] = await db.execute(
        'SELECT drop_lat, drop_lon FROM rides WHERE ride_id = ?',
        [ride_id]
      );
      const ride = rows[0];

      // TODO: calculate real ETA using maps
      const eta = 10;

      io.to(`ride_${ride_id}_user`).emit('DRIVER_LOCATION_UPDATE', {
        latitude,
        longitude,
        speed,
        eta,
        timestamp
      });
    });

    socket.on('disconnect', () => {});
  });
}

module.exports = { initSockets };
