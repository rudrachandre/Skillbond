const express = require('express');
const { blockUser, unblockUser, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.put('/profile', protect, updateProfile);
router.post('/block/:userId', protect, blockUser);
router.post('/unblock/:userId', protect, unblockUser);

module.exports = router;
