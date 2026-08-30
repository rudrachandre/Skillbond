const express = require('express');
const { blockUser, getBlockedUsers, getStatus, restrictUser, unblockUser, unrestrictUser, updateOnlineStatus, updateProfileVisibility, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.put('/profile', protect, updateProfile);
router.patch('/settings/online-status', protect, updateOnlineStatus);
router.patch('/settings/profile-visibility', protect, updateProfileVisibility);
router.get('/blocked', protect, getBlockedUsers);
router.post('/block/:userId', protect, blockUser);
router.post('/unblock/:userId', protect, unblockUser);
router.post('/restrict/:userId', protect, restrictUser);
router.post('/unrestrict/:userId', protect, unrestrictUser);
router.get('/:userId/status', protect, getStatus);

module.exports = router;
