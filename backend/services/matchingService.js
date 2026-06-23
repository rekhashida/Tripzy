// Driver matching: within 2km, vehicle type, online & available, rating >= 3.5, sort by distance
const pool = require('../config/db');

const RADIUS_KM = 2;
const MIN_RATING = 3.5;

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function findNearbyDrivers(pickupLat, pickupLng, vehicleType, limit = 5) {
  const [drivers] = await pool.query(
    `SELECT d.id, d.user_id, d.vehicle_type, d.vehicle_number, d.rating, d.is_online, d.is_available,
            dl.latitude, dl.longitude
     FROM drivers d
     LEFT JOIN driver_locations dl ON dl.driver_id = d.id
     WHERE d.is_online = 1 AND d.is_available = 1 AND d.rating >= ?
      AND (d.vehicle_type = ? OR ? IS NULL)`,
    [MIN_RATING, vehicleType || 'sedan', vehicleType]
  );
  const withDistance = drivers
    .filter(d => d.latitude != null && d.longitude != null)
    .map(d => ({
      ...d,
      distanceKm: haversineDistance(pickupLat, pickupLng, parseFloat(d.latitude), parseFloat(d.longitude))
    }))
    .filter(d => d.distanceKm <= RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
  return withDistance;
}

module.exports = { findNearbyDrivers, haversineDistance };
