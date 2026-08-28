const express = require('express');
const { deleteMessage, getInbox, getMessages } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/inbox', protect, getInbox);
router.delete('/:messageId', protect, deleteMessage);
router.get('/:matchId', protect, getMessages);

module.exports = router;
