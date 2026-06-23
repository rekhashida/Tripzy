// backend/controllers/rideController.js
const FareService = require('../services/fareService');
const MatchingService = require('../services/matchingService');
const OTPService = require('../services/otpService');

exports.calculateFare = async (req, res) => {
  try {
    const { pickup, drop } = req.body;
    const result = await FareService.calculateFare(pickup, drop);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: 'Fare calculation failed' });
  }
};

exports.requestRide = async (req, res) => {
  try {
    const { pickup, drop, vehicle_type, estimated_fare } = req.body;
    const user_id = req.user.user_id;
    const rideRequest = await MatchingService.matchDriver({
      user_id,
      pickup,
      drop,
      vehicle_type,
      estimated_fare
    });
    return res.json(rideRequest);
  } catch (err) {
    return res.status(500).json({ message: 'Ride request failed' });
  }
};

exports.generatePickupOtp = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const result = await OTPService.generate(ride_id);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: 'OTP generation failed' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { ride_id } = req.params;
    const { otp } = req.body;
    const result = await OTPService.verify(ride_id, otp);
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};
