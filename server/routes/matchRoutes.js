const express = require('express');
const { getMatches, getMyMatches, getPendingMatches, muteMatch, requestMatch, respondToMatch, unmatch, unmuteMatch } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/discover', protect, getMatches);
router.get('/pending', protect, getPendingMatches);
router.post('/request/:userId', protect, requestMatch);
router.post('/respond/:matchId', protect, respondToMatch);
router.get('/my-matches', protect, getMyMatches);
router.post('/mute/:matchId', protect, muteMatch);
router.post('/unmute/:matchId', protect, unmuteMatch);
router.delete('/:matchId', protect, unmatch);

module.exports = router;
