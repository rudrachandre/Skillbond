const express = require('express');
const { createSession, getMySessions, updateSessionStatus } = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createSession);
router.get('/', protect, getMySessions);
router.patch('/:id', protect, updateSessionStatus);

module.exports = router;
