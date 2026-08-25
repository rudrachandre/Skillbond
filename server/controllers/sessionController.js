const Match = require('../models/Match');
const Session = require('../models/Session');

const isParticipant = (session, userId) => (
  session.userA.toString() === userId.toString() || session.userB.toString() === userId.toString()
);

const createSession = async (req, res) => {
  try {
    const { duration = 60, matchId, scheduledAt, skillTaught } = req.body;

    if (!matchId || !skillTaught || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'matchId, skillTaught, and scheduledAt are required',
      });
    }

    const date = new Date(scheduledAt);
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ success: false, message: 'scheduledAt must be a valid date' });
    }

    const parsedDuration = Number(duration);
    if (!Number.isFinite(parsedDuration) || parsedDuration < 15 || parsedDuration > 480) {
      return res.status(400).json({ success: false, message: 'Duration must be between 15 and 480 minutes' });
    }

    const match = await Match.findOne({
      _id: matchId,
      status: 'accepted',
      $or: [{ userA: req.user._id }, { userB: req.user._id }],
    });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Accepted match not found' });
    }

    const otherUser = match.userA.toString() === req.user._id.toString() ? match.userB : match.userA;
    const session = await Session.create({
      matchId: match._id,
      userA: req.user._id,
      userB: otherUser,
      skillTaught: skillTaught.trim(),
      scheduledAt: date,
      duration: parsedDuration,
    });

    return res.status(201).json({
      success: true,
      message: 'Session requested successfully',
      data: { session },
    });
  } catch (error) {
    console.error(`Session creation error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to create session' });
  }
};

const getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ userA: req.user._id }, { userB: req.user._id }],
    })
      .populate('userA', '-password')
      .populate('userB', '-password')
      .sort({ scheduledAt: 1 });

    return res.json({
      success: true,
      message: 'Sessions retrieved',
      data: { sessions },
    });
  } catch (error) {
    console.error(`Session retrieval error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to retrieve sessions' });
  }
};

const updateSessionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be confirmed, completed, or cancelled',
      });
    }

    const session = await Session.findById(req.params.id);
    if (!session || !isParticipant(session, req.user._id)) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const isRecipient = session.userB.toString() === req.user._id.toString();
    const allowed = (session.status === 'requested' && ((status === 'confirmed' && isRecipient) || status === 'cancelled'))
      || (session.status === 'confirmed' && (status === 'completed' || status === 'cancelled'));

    if (!allowed) {
      return res.status(400).json({ success: false, message: 'Invalid session status transition' });
    }

    session.status = status;
    await session.save();

    return res.json({
      success: true,
      message: 'Session status updated',
      data: { session },
    });
  } catch (error) {
    console.error(`Session status error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to update session status' });
  }
};

module.exports = { createSession, getMySessions, updateSessionStatus };
