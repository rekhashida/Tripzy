const express = require('express');
const { auth } = require('../middleware/auth');
const { createPoolRide, joinPool, listPools, simulateJoin } = require('../controllers/poolingController');
const router = express.Router();

router.post('/create', auth, createPoolRide);
router.post('/join', auth, joinPool);
router.post('/simulate-join', auth, simulateJoin);
router.get('/available', listPools);

module.exports = router;
