// Fare calculation: Base + Distance + Time + Surge + Luggage (from PDF)
const BASE_FARE = 50;
const PER_KM = 10;
const PER_MIN = 1;
const PEAK_HOUR_MORNING_START = 8.5;  // 8:30 AM
const PEAK_HOUR_MORNING_END = 10;     // 10:00 AM
const PEAK_HOUR_EVENING_START = 18;   // 6:00 PM
const PEAK_HOUR_EVENING_END = 20.5;   // 8:30 PM
const LATE_NIGHT_START = 22;          // 10:00 PM
const LATE_NIGHT_END = 6;             // 6:00 AM
const SURGE_MULTIPLIER_PEAK = 1.5;    // 50% surge during peak hours
const SURGE_MULTIPLIER_LATE_NIGHT = 1.3; // 30% surge during late night

// Luggage size multipliers
const LUGGAGE_MULTIPLIERS = {
  'small': 1.0,     // No extra charge
  'medium': 1.5,    // 50% extra (price × 0.5 added)
  'large': 1.8      // 80% extra (price × 0.8 added)
};

// Vehicle type multipliers (affect base/subtotal before surge)
// These are relative to a `sedan` base (1.0)
const VEHICLE_MULTIPLIERS = {
  'bike': 0.6,
  'hatchback': 0.9,
  'sedan': 1.0,
  'suv': 1.3,
  'auto': 0.8 // Auto rickshaw option (new)
};
/**
 * Check if current time is within peak hours
 * Peak hours: 8:30-10:00 AM and 6:00-8:30 PM
 */
function isPeakHour() {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const timeInHours = hour + minutes / 60;

  // Morning peak: 8:30 AM to 10:00 AM
  const isMorningPeak = hour === 8 && minutes >= 30 || (hour === 9) || (hour === 10 && minutes === 0);
  
  // Evening peak: 6:00 PM to 8:30 PM
  const isEveningPeak = (hour === 18) || (hour === 19) || (hour === 20 && minutes <= 30);

  return isMorningPeak || isEveningPeak;
}

/**
 * Check if current time is late night
 * Late night: 10:00 PM to 6:00 AM
 */
function isLateNight() {
  const now = new Date();
  const hour = now.getHours();
  
  // Late night: 10:00 PM (22:00) to 6:00 AM (06:00)
  return hour >= LATE_NIGHT_START || hour < LATE_NIGHT_END;
}

/**
 * Get luggage size multiplier
 * @param {string} luggageSize - Size of luggage ('small', 'medium', 'large')
 * @returns {number} Luggage multiplier (1.0, 1.5, or 1.8)
 */
function getLuggageMultiplier(luggageSize = 'small') {
  const multiplier = LUGGAGE_MULTIPLIERS[luggageSize?.toLowerCase()] || LUGGAGE_MULTIPLIERS['small'];
  return multiplier;
}

function getVehicleMultiplier(vehicleType = 'sedan') {
  const m = VEHICLE_MULTIPLIERS[vehicleType?.toLowerCase()] || VEHICLE_MULTIPLIERS['sedan'];
  return m;
}
/**
 * Get current surge multiplier based on time and ride request volume
 * @param {number} activeRideRequests - Number of active ride requests at current time
 * @returns {number} Surge multiplier (1.0 = no surge, 1.5 = 50% surge, etc.)
 */
function getSurgeMultiplier(activeRideRequests = 0) {
  let surge = 1.0;

  // Peak hour surge (morning & evening)
  if (isPeakHour()) {
    surge = SURGE_MULTIPLIER_PEAK;
  }
  // Late night surge (10 PM - 6 AM)
  else if (isLateNight()) {
    // Base late night surge
    surge = SURGE_MULTIPLIER_LATE_NIGHT;
    
    // Additional surge if high demand (more than 5 active requests)
    if (activeRideRequests > 5) {
      surge = surge + (0.1 * Math.min(activeRideRequests - 5, 3)); // Max +0.3
    }
  }

  return surge;
}

function calculateRideFare(distanceKm, durationMin, vehicleType = 'sedan', activeRideRequests = 0, luggageSize = 'small') {
  let base = BASE_FARE;
  let distanceFare = distanceKm * PER_KM;
  let timeFare = durationMin * PER_MIN;
  let subtotal = base + distanceFare + timeFare;

  // Apply vehicle multiplier to subtotal (affects base pricing)
  const vehicleMultiplier = getVehicleMultiplier(vehicleType);
  const vehicleAdjustedSubtotal = subtotal * vehicleMultiplier;
  
  // Apply surge multiplier (time-based and demand-based) on vehicle-adjusted subtotal
  let surge = getSurgeMultiplier(activeRideRequests);
  let surgeAdjustedFare = vehicleAdjustedSubtotal * surge;
  
  // Apply luggage multiplier
  let luggageMultiplier = getLuggageMultiplier(luggageSize);
  let final = Math.round(surgeAdjustedFare * luggageMultiplier);
  
  return { 
    base, 
    distanceFare, 
    timeFare, 
    subtotal,
    vehicleMultiplier,
    vehicleAdjustedSubtotal,
    surge,
    surgeAdjustedFare,
    luggageSize,
    luggageMultiplier,
    final,
    isPeakHour: isPeakHour(),
    isLateNight: isLateNight()
  };
}

function calculateParcelFare(distanceKm, weightKg = 1) {
  const base = 40;
  const perKm = 8;
  const perKg = 5;
  return Math.round(base + distanceKm * perKm + weightKg * perKg);
}

function calculatePoolFareShare(totalFare, totalPassengers) {
  return Math.round(totalFare / totalPassengers);
}

module.exports = { 
  calculateRideFare, 
  calculateParcelFare, 
  calculatePoolFareShare, 
  isPeakHour,
  isLateNight,
  getSurgeMultiplier,
  getLuggageMultiplier
};
