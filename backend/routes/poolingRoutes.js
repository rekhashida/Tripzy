const express = require('express');
const { auth } = require('../middleware/auth');
const { createPoolRide, joinPool, listPools } = require('../controllers/poolingController');
const router = express.Router();

router.post('/create', auth, createPoolRide);
router.post('/join', auth, joinPool);
router.get('/available', listPools);

module.exports = router;
