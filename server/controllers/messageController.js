const Match = require('../models/Match');
const Message = require('../models/Message');
const { getSocketServer } = require('../utils/notify');

const canAccessMatch = (matchId, userId) => Match.findOne({
  _id: matchId,
  status: 'accepted',
  $or: [{ userA: userId }, { userB: userId }],
});

const getInbox = async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [{ userA: req.user._id }, { userB: req.user._id }],
      status: 'accepted',
    })
      .populate('userA', 'name avatar')
      .populate('userB', 'name avatar')
      .sort({ updatedAt: -1 });

    const conversations = await Promise.all(matches.map(async (match) => {
      const other = String(match.userA?._id) === String(req.user._id) ? match.userB : match.userA;
      const lastMessage = await Message.findOne({ matchId: match._id }).sort({ createdAt: -1 });
      return {
        matchId: match._id,
        user: other
          ? { id: other._id, name: other.name, avatar: other.avatar }
          : null,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              sender: lastMessage.sender,
            }
          : null,
      };
    }));

    return res.json({
      success: true,
      message: 'Inbox retrieved',
      data: { conversations },
    });
  } catch (error) {
    console.error(`Inbox error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to retrieve inbox' });
  }
};

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

const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    if (String(message.sender) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages' });
    }

    message.isDeleted = true;
    await message.save();

    // Real-time update for the other user in this chat.
    const io = getSocketServer();
    io?.to(String(message.matchId)).emit('message_deleted', {
      matchId: String(message.matchId),
      messageId: String(message._id),
    });

    return res.json({ success: true, message: 'Message deleted', data: { messageId: String(message._id) } });
  } catch (error) {
    console.error(`Delete message error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to delete message' });
  }
};

module.exports = { canAccessMatch, deleteMessage, getInbox, getMessages };
