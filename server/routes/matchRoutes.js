const express = require('express');
const { getMatches, getMyMatches, getPendingMatches, requestMatch, respondToMatch, unmatch } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/discover', protect, getMatches);
router.get('/pending', protect, getPendingMatches);
router.post('/request/:userId', protect, requestMatch);
router.post('/respond/:matchId', protect, respondToMatch);
router.get('/my-matches', protect, getMyMatches);
router.delete('/:matchId', protect, unmatch);

module.exports = router;
