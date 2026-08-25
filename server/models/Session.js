const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
  },
  userA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skillTaught: {
    type: String,
    required: true,
    trim: true,
  },
  scheduledAt: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    default: 60,
    min: 15,
  },
  status: {
    type: String,
    enum: ['requested', 'confirmed', 'completed', 'cancelled'],
    default: 'requested',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Session', sessionSchema);
