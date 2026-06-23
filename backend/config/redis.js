// backend/config/redis.js
const { createClient } = require('redis');

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

client.on('error', (err) => console.error('Redis error', err));

(async () => {
  await client.connect();
  console.log('Redis connected');
})();

module.exports = client;
