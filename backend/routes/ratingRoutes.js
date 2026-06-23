const express = require('express');
const { auth } = require('../middleware/auth');
const { submitRating } = require('../controllers/ratingsController');
const router = express.Router();

router.post('/', auth, submitRating);

module.exports = router;
