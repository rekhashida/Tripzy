// Google Maps API - distance & duration (frontend can also use Maps JavaScript API)
const MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function getDistanceAndDuration(originLat, originLng, destLat, destLng) {
  if (!MAPS_API_KEY) {
    // Fallback: rough estimate 1 deg ≈ 111 km
    const km = Math.sqrt(Math.pow((destLat - originLat) * 111, 2) + Math.pow((destLng - originLng) * 111, 2));
    const min = Math.round(km * 1.6); // ~37.5 km/h average city traffic assumption
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
  return { distanceKm: Math.round(km * 100) / 100, durationMin: Math.max(1, Math.round(km * 1.6)) };
}

function optimizeTSPRoute(pickupLoc, stops) {
  if (!stops || stops.length <= 1) return stops;

  const unvisited = [...stops];
  const orderedStops = [];
  let currentLat = pickupLoc.lat;
  let currentLng = pickupLoc.lng;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const stop = unvisited[i];
      const dist = Math.sqrt(Math.pow((stop.lat - currentLat) * 111, 2) + Math.pow((stop.lng - currentLng) * 111, 2));
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = i;
      }
    }

    const nextStop = unvisited.splice(nearestIdx, 1)[0];
    orderedStops.push(nextStop);
    currentLat = nextStop.lat;
    currentLng = nextStop.lng;
  }

  return orderedStops;
}

function calculateMultimodalRoute(distanceKm) {
  if (!distanceKm || distanceKm < 3) return null;

  const leg1Auto = 25;
  const leg2Metro = 15;
  const leg3Bike = 10;
  const totalMultimodalFare = leg1Auto + leg2Metro + leg3Bike;

  return {
    isAvailable: true,
    totalFare: totalMultimodalFare,
    legs: [
      { mode: '🛺 Auto Rickshaw', detail: 'Pickup ➔ Central Metro Station', fare: leg1Auto, durationMin: 6 },
      { mode: '🚆 Rapid Metro Train', detail: 'Central Station ➔ Tech Park Station', fare: leg2Metro, durationMin: 14 },
      { mode: '🚲 Electric Bike / Walk', detail: 'Tech Park Station ➔ Destination', fare: leg3Bike, durationMin: 4 }
    ],
    savingsPercent: 65
  };
}

module.exports = { getDistanceAndDuration, optimizeTSPRoute, calculateMultimodalRoute };
