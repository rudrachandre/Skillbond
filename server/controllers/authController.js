const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

module.exports = { login, register, userData };
