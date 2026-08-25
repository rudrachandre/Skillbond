const express = require('express');
const { getMatches, getMyMatches, requestMatch, respondToMatch } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/discover', protect, getMatches);
router.post('/request/:userId', protect, requestMatch);
router.post('/respond/:matchId', protect, respondToMatch);
router.get('/my-matches', protect, getMyMatches);

module.exports = router;
