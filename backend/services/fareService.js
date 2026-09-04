// Fare calculation: Budget-friendly rates (Base + Distance + Time + Soft Surge + Moderate Luggage)
const BASE_FARE = 30;                 // Reduced from 50 to 30 for budget friendliness
const PER_KM = 7.5;                    // Reduced from 10 to 7.5 per km
const PER_MIN = 0.5;                   // Reduced from 1 to 0.5 per minute
const PEAK_HOUR_MORNING_START = 8.5;   // 8:30 AM
const PEAK_HOUR_MORNING_END = 10;      // 10:00 AM
const PEAK_HOUR_EVENING_START = 18;    // 6:00 PM
const PEAK_HOUR_EVENING_END = 20.5;    // 8:30 PM
const LATE_NIGHT_START = 22;           // 10:00 PM
const LATE_NIGHT_END = 6;              // 6:00 AM
const SURGE_MULTIPLIER_PEAK = 1.2;     // Softened peak surge from 1.5 (50%) down to 1.2 (20%)
const SURGE_MULTIPLIER_LATE_NIGHT = 1.15; // Softened late night surge down to 1.15 (15%)

// Moderate & Budget-friendly Luggage multipliers
const LUGGAGE_MULTIPLIERS = {
  'small': 1.0,     // No extra charge
  'medium': 1.1,    // 10% nominal fee
  'large': 1.25     // 25% nominal fee
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
  const base = 25;   // Reduced from 40 to 25
  const perKm = 5.5; // Reduced from 8 to 5.5 per km
  const perKg = 3;   // Reduced from 5 to 3 per kg
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
