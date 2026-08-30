const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    skill: {
      type: String,
      trim: true,
    },
    level: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  skillsOffered: {
    type: [skillSchema],
    default: [],
  },
  skillsWanted: {
    type: [skillSchema],
    default: [],
  },
  bio: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  credits: {
    type: Number,
    default: 20,
  },
  blockedUsers: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: [],
  },
  restrictedUsers: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: [],
  },
  mutedMatches: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Match',
    default: [],
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);
