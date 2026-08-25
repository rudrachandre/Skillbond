const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Review = require('../models/Review');
const Session = require('../models/Session');

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const userData = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  skillsOffered: user.skillsOffered,
  skillsWanted: user.skillsWanted,
  bio: user.bio,
  avatar: user.avatar,
  credits: user.credits,
  createdAt: user.createdAt,
});

const getEnrichedUser = async (user) => {
  const [ratingData, completedSessions] = await Promise.all([
    Review.aggregate([
      { $match: { reviewee: user._id } },
      { $group: { _id: null, averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ]),
    Session.countDocuments({ status: 'completed', $or: [{ userA: user._id }, { userB: user._id }] }),
  ]);
  const rating = ratingData[0] || { averageRating: 0, reviewCount: 0 };
  return { ...userData(user), averageRating: Number((rating.averageRating || 0).toFixed(1)), reviewCount: rating.reviewCount, completedSessions };
};

const getMe = async (req, res) => {
  try {
    return res.json({ success: true, message: 'Authenticated user retrieved', data: { user: await getEnrichedUser(req.user) } });
  } catch (error) {
    console.error(`Profile retrieval error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to retrieve profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) return res.status(400).json({ success: false, message: 'Current password and a new password of at least 6 characters are required' });
    if (!(await bcrypt.compare(currentPassword, req.user.password))) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    req.user.password = newPassword;
    await req.user.save();
    return res.json({ success: true, message: 'Password changed successfully', data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to change password' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    await User.deleteOne({ _id: req.user._id });
    return res.json({ success: true, message: 'Account deleted successfully', data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to delete account' });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token: createToken(user._id),
        user: userData(user),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    console.error(`Registration error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Unable to register user',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    const passwordMatches = user && (await bcrypt.compare(password, user.password));

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token: createToken(user._id),
        user: userData(user),
      },
    });
  } catch (error) {
    console.error(`Login error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Unable to log in',
    });
  }
};

module.exports = { changePassword, deleteAccount, getEnrichedUser, getMe, login, register, userData };
