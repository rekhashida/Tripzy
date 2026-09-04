const express = require('express');
const { auth } = require('../middleware/auth');
const {
  getCommutePasses,
  buyCommutePass,
  getCorporateAccount,
  saveCorporateAccount
} = require('../controllers/commuteController');

const router = express.Router();

router.use(auth);

router.get('/passes', getCommutePasses);
router.post('/passes', buyCommutePass);
router.get('/corporate', getCorporateAccount);
router.post('/corporate', saveCorporateAccount);

module.exports = router;
