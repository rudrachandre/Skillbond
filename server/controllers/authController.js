const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
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
  role: user.role,
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
    const user = await User.findById(req.user._id);
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists' });
    if (!(await bcrypt.compare(currentPassword, user.password))) return res.status(403).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    return res.json({ success: true, message: 'Password changed successfully', data: {} });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to change password' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Respond with the same generic message regardless of whether the account
    // exists so the endpoint cannot be used to enumerate registered emails.
    if (!user) {
      return res.json({ success: true, message: 'If an account exists with that email, a reset link has been sent.', data: {} });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // Build the frontend link. CLIENT_URL should be set in the environment
    // (local .env and on Render); fall back to the deployed client URL.
    const clientUrl = process.env.CLIENT_URL || 'https://skillbond.onrender.com';
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    // The generic message below is used for both found and not-found cases so
    // the endpoint cannot be used to enumerate registered emails.
    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset your SkillBond password',
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#0f172a;margin:0 0 12px;">Reset your SkillBond password</h2>
          <p style="color:#475569;line-height:1.6;">You requested a password reset. Click the button below to choose a new password. This link expires in 1 hour.</p>
          <p style="margin:24px 0;"><a href="${resetUrl}" style="background:#0f172a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset password</a></p>
          <p style="color:#94a3b8;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>`,
      });
    } catch (emailError) {
      console.error(`Reset email delivery failed: ${emailError.message}`);
      return res.status(500).json({ success: false, message: 'Unable to send reset email. Please try again later.' });
    }

    return res.json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
      data: {},
    });
  } catch (error) {
    console.error(`Forgot password error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to process forgot password request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password of at least 6 characters is required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired' });
    }

    user.password = newPassword; // hashed by the pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ success: true, message: 'Password reset successfully', data: {} });
  } catch (error) {
    console.error(`Reset password error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to reset password' });
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

module.exports = { changePassword, deleteAccount, forgotPassword, getEnrichedUser, getMe, login, register, resetPassword, userData };
