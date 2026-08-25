const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  matchScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Match', matchSchema);
