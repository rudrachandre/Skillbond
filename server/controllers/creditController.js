const CreditTransaction = require('../models/CreditTransaction');

const getMyTransactions = async (req, res) => {
  try {
    const transactions = await CreditTransaction.find({ user: req.user._id })
      .populate('session', 'skillTaught scheduledAt duration')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      message: 'Credit history retrieved',
      data: { transactions },
    });
  } catch (error) {
    console.error(`Credit history error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve credit history',
    });
  }
};

module.exports = { getMyTransactions };
