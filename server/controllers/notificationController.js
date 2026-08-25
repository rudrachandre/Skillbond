const Notification = require('../models/Notification');

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    return res.json({
      success: true,
      message: 'Notifications retrieved',
      data: { notifications },
    });
  } catch (error) {
    console.error(`Notification retrieval error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to retrieve notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (error) {
    console.error(`Notification update error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to update notification' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    return res.json({ success: true, message: 'All notifications marked as read', data: {} });
  } catch (error) {
    console.error(`Notification bulk update error: ${error.message}`);
    return res.status(500).json({ success: false, message: 'Unable to update notifications' });
  }
};

module.exports = { getMyNotifications, markAllAsRead, markAsRead };
