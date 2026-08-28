const Match = require('../models/Match');
const User = require('../models/User');
const { isOnline } = require('../utils/notify');

const updateProfile = async (req, res) => {
  try {
    const { avatar, bio, name, skillsOffered, skillsWanted } = req.body;

    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ success: false, message: 'Name must be a non-empty string' });
    }

    if (avatar !== undefined && typeof avatar !== 'string') {
      return res.status(400).json({ success: false, message: 'Avatar must be a string URL' });
    }

    if (skillsOffered !== undefined && !Array.isArray(skillsOffered)) {
      return res.status(400).json({
        success: false,
        message: 'skillsOffered must be an array',
      });
    }

    if (skillsWanted !== undefined && !Array.isArray(skillsWanted)) {
      return res.status(400).json({
        success: false,
        message: 'skillsWanted must be an array',
      });
    }

    if (bio !== undefined && typeof bio !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Bio must be a string',
      });
    }

    if (name !== undefined) req.user.name = name.trim();
    if (avatar !== undefined) req.user.avatar = avatar.trim();
    if (skillsOffered !== undefined) req.user.skillsOffered = skillsOffered;
    if (skillsWanted !== undefined) req.user.skillsWanted = skillsWanted;
    if (bio !== undefined) req.user.bio = bio.trim();

    await req.user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: req.user },
    });
  } catch (error) {
    console.error(`Profile update error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Unable to update profile',
    });
  }
};

const blockUser = async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (String(req.user._id) === String(targetId)) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself' });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!req.user.blockedUsers.some((id) => String(id) === String(targetId))) {
      req.user.blockedUsers.push(targetId);
    }
    await req.user.save();

    // Cancel/remove any existing match between the two users (pending or accepted).
    await Match.deleteMany({
      $or: [
        { userA: req.user._id, userB: targetId },
        { userA: targetId, userB: req.user._id },
      ],
    });

    return res.json({ success: true, message: 'User blocked', data: {} });
  } catch (error) {
    console.error(`Block user error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to block user' });
  }
};

const unblockUser = async (req, res) => {
  try {
    const targetId = req.params.userId;
    req.user.blockedUsers = req.user.blockedUsers.filter((id) => String(id) !== String(targetId));
    await req.user.save();
    return res.json({ success: true, message: 'User unblocked', data: {} });
  } catch (error) {
    console.error(`Unblock user error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to unblock user' });
  }
};

const getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('lastActive name');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({
      success: true,
      message: 'User status retrieved',
      data: { online: isOnline(req.params.userId), lastActive: user.lastActive },
    });
  } catch (error) {
    console.error(`User status error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to retrieve user status' });
  }
};

module.exports = { blockUser, getStatus, unblockUser, updateProfile };
