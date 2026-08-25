const express = require('express');
const { getMyTransactions } = require('../controllers/creditController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/transactions', protect, getMyTransactions);

module.exports = router;
