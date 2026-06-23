// Google Maps API - distance & duration (frontend can also use Maps JavaScript API)
const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function getDistanceAndDuration(originLat, originLng, destLat, destLng) {
  if (!MAPS_API_KEY) {
    // Fallback: rough estimate 1 deg ≈ 111 km
    const km = Math.sqrt(Math.pow((destLat - originLat) * 111, 2) + Math.pow((destLng - originLng) * 111, 2));
    const min = Math.round(km * 3); // ~20 km/h assumption
    return { distanceKm: Math.round(km * 100) / 100, durationMin: Math.max(1, min) };
  }
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${MAPS_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.rows?.[0]?.elements?.[0]?.status === 'OK') {
      const e = data.rows[0].elements[0];
      return {
        distanceKm: e.distance.value / 1000,
        durationMin: Math.ceil(e.duration.value / 60)
      };
    }
  } catch (err) {
    console.error('Maps API error:', err.message);
  }
  const km = Math.sqrt(Math.pow((destLat - originLat) * 111, 2) + Math.pow((destLng - originLng) * 111, 2));
  return { distanceKm: Math.round(km * 100) / 100, durationMin: Math.max(1, Math.round(km * 3)) };
}

module.exports = { getDistanceAndDuration };
