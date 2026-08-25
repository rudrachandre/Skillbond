const mongoose = require('mongoose');

const creditTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  type: {
    type: String,
    enum: ['earned', 'spent'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

creditTransactionSchema.index({ session: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('CreditTransaction', creditTransactionSchema);
