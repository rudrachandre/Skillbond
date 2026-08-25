const Match = require('../models/Match');
const User = require('../models/User');

const skillNames = (skills = []) => new Set(
  skills
    .map(({ skill }) => skill?.trim().toLowerCase())
    .filter(Boolean),
);

const overlap = (source, target) => [...source].filter((skill) => target.has(skill));

const publicUser = (user) => ({
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

const getMatches = async (req, res) => {
  try {
    const currentUser = req.user;
    const offeredByCurrentUser = skillNames(currentUser.skillsOffered);
    const wantedByCurrentUser = skillNames(currentUser.skillsWanted);
    const users = await User.find({ _id: { $ne: currentUser._id } }).select('-password');

    const matches = users
      .map((user) => {
        const offeredByCandidate = skillNames(user.skillsOffered);
        const wantedByCandidate = skillNames(user.skillsWanted);
        const teachableOverlap = overlap(offeredByCandidate, wantedByCurrentUser);
        const learningOverlap = overlap(wantedByCandidate, offeredByCurrentUser);
        const mutual = teachableOverlap.length > 0 && learningOverlap.length > 0;
        const offeredRatio = wantedByCurrentUser.size ? teachableOverlap.length / wantedByCurrentUser.size : 0;
        const wantedRatio = offeredByCurrentUser.size ? learningOverlap.length / offeredByCurrentUser.size : 0;
        const matchScore = mutual
          ? Math.round(((offeredRatio + wantedRatio) / 2) * 100)
          : Math.round(Math.max(offeredRatio, wantedRatio) * 50);

        if (matchScore === 0) return null;

        return {
          ...publicUser(user),
          matchScore,
          mutual,
          matchingSkills: {
            theyCanTeach: teachableOverlap,
            theyWantToLearn: learningOverlap,
          },
        };
      })
      .filter(Boolean)
      .sort((first, second) => second.matchScore - first.matchScore || Number(second.mutual) - Number(first.mutual));

    return res.json({
      success: true,
      message: 'Potential matches retrieved',
      data: { matches },
    });
  } catch (error) {
    console.error(`Match discovery error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Unable to discover matches',
    });
  }
};

const requestMatch = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user._id.toString() === userId) {
      return res.status(400).json({ success: false, message: 'You cannot match with yourself' });
    }

    const targetUser = await User.findById(userId).select('-password');
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existingMatch = await Match.findOne({
      $or: [
        { userA: req.user._id, userB: userId },
        { userA: userId, userB: req.user._id },
      ],
    });

    if (existingMatch) {
      return res.status(409).json({ success: false, message: 'A match request already exists' });
    }

    const offeredByCurrentUser = skillNames(req.user.skillsOffered);
    const wantedByCurrentUser = skillNames(req.user.skillsWanted);
    const teachableOverlap = overlap(skillNames(targetUser.skillsOffered), wantedByCurrentUser);
    const learningOverlap = overlap(skillNames(targetUser.skillsWanted), offeredByCurrentUser);
    const offeredRatio = wantedByCurrentUser.size ? teachableOverlap.length / wantedByCurrentUser.size : 0;
    const wantedRatio = offeredByCurrentUser.size ? learningOverlap.length / offeredByCurrentUser.size : 0;
    const mutual = teachableOverlap.length > 0 && learningOverlap.length > 0;
    const matchScore = mutual ? Math.round(((offeredRatio + wantedRatio) / 2) * 100) : Math.round(Math.max(offeredRatio, wantedRatio) * 50);
    const match = await Match.create({ userA: req.user._id, userB: userId, matchScore });

    return res.status(201).json({
      success: true,
      message: 'Match request sent',
      data: { match },
    });
  } catch (error) {
    console.error(`Match request error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to send match request' });
  }
};

const getPendingMatches = async (req, res) => {
  try {
    const matches = await Match.find({ userB: req.user._id, status: 'pending' })
      .populate('userA', '-password')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      message: 'Pending match requests retrieved',
      data: { matches },
    });
  } catch (error) {
    console.error(`Pending matches error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to retrieve pending requests' });
  }
};

const respondToMatch = async (req, res) => {
  try {
    const { action } = req.body;
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action must be accept or reject' });
    }

    const match = await Match.findOne({ _id: req.params.matchId, userB: req.user._id, status: 'pending' });
    if (!match) {
      return res.status(404).json({ success: false, message: 'Pending match request not found' });
    }

    match.status = action === 'accept' ? 'accepted' : 'rejected';
    await match.save();

    return res.json({
      success: true,
      message: `Match request ${action}ed`,
      data: { match },
    });
  } catch (error) {
    console.error(`Match response error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to respond to match request' });
  }
};

const getMyMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [{ userA: req.user._id }, { userB: req.user._id }],
      status: 'accepted',
    })
      .populate('userA', '-password')
      .populate('userB', '-password')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      message: 'Accepted matches retrieved',
      data: { matches },
    });
  } catch (error) {
    console.error(`Accepted matches error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to retrieve matches' });
  }
};

module.exports = { getMatches, getMyMatches, getPendingMatches, requestMatch, respondToMatch };
