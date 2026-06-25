const express = require('express');
const { register, login, getProfile, googleLogin, sendMobileOtp, verifyMobileOtp } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/send-otp', sendMobileOtp);
router.post('/verify-otp', verifyMobileOtp);
router.get('/profile', auth, getProfile);

module.exports = router;
