const User = require('../models/User');
const Match = require('../models/Match');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Report = require('../models/Report');

const getStats = async (req, res) => {
  try {
    const [totalUsers, sessionsByStatus, matchesByStatus, pendingReports, totalMessages] = await Promise.all([
      User.countDocuments({}),
      Session.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Match.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Report.countDocuments({ status: 'pending' }),
      Message.countDocuments({}),
    ]);

    const toMap = (rows) => rows.reduce((acc, row) => ({ ...acc, [row._id]: row.count }), {});
    const sessionCounts = toMap(sessionsByStatus);
    const matchCounts = toMap(matchesByStatus);

    return res.json({
      success: true,
      data: {
        totalUsers,
        sessions: {
          requested: sessionCounts.requested || 0,
          confirmed: sessionCounts.confirmed || 0,
          completed: sessionCounts.completed || 0,
          cancelled: sessionCounts.cancelled || 0,
        },
        matches: {
          pending: matchCounts.pending || 0,
          accepted: matchCounts.accepted || 0,
          rejected: matchCounts.rejected || 0,
        },
        pendingReports,
        totalMessages,
      },
    });
  } catch (error) {
    console.error(`Admin stats error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to load stats' });
  }
};

const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const filter = {};

    if (req.query.search && req.query.search.trim()) {
      const search = req.query.search.trim();
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email role credits createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        users,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(`Admin users error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to load users' });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find({})
      .populate('reporter', 'name email')
      .populate('reportedUser', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: { reports } });
  } catch (error) {
    console.error(`Admin reports error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to load reports' });
  }
};

const updateReportStatus = async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = 'reviewed';
    await report.save();

    return res.json({ success: true, message: 'Report marked as reviewed', data: { report } });
  } catch (error) {
    console.error(`Admin report update error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to update report' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be either user or admin' });
    }

    if (req.params.userId === String(req.user._id) && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'You cannot remove your own admin role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    ).select('name email role');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, message: `Role updated to ${role}`, data: { user } });
  } catch (error) {
    console.error(`Admin role update error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to update role' });
  }
};

module.exports = { getReports, getStats, getUsers, updateReportStatus, updateUserRole };
