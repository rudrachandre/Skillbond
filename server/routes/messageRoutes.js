const express = require('express');
const { getInbox, getMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/inbox', protect, getInbox);
router.get('/:matchId', protect, getMessages);

module.exports = router;
