const Report = require('../models/Report');

const createReport = async (req, res) => {
  try {
    const { reportedUser, reason } = req.body;

    if (!reportedUser || !reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A reported user and a reason are required' });
    }

    if (String(req.user._id) === String(reportedUser)) {
      return res.status(400).json({ success: false, message: 'You cannot report yourself' });
    }

    const report = await Report.create({
      reporter: req.user._id,
      reportedUser,
      reason: reason.trim(),
    });

    return res.status(201).json({ success: true, message: 'Report submitted', data: { report } });
  } catch (error) {
    console.error(`Report create error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to submit report' });
  }
};

module.exports = { createReport };
