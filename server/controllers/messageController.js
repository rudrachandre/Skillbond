const Match = require('../models/Match');
const Message = require('../models/Message');

const canAccessMatch = (matchId, userId) => Match.findOne({
  _id: matchId,
  status: 'accepted',
  $or: [{ userA: userId }, { userB: userId }],
});

const getMessages = async (req, res) => {
  try {
    const match = await canAccessMatch(req.params.matchId, req.user._id);
    if (!match) {
      return res.status(404).json({ success: false, message: 'Accepted match not found' });
    }

    const messages = await Message.find({ matchId: match._id })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    return res.json({
      success: true,
      message: 'Chat history retrieved',
      data: { messages },
    });
  } catch (error) {
    console.error(`Message history error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to retrieve chat history' });
  }
};

module.exports = { canAccessMatch, getMessages };
