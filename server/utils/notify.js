const Notification = require('../models/Notification');
const User = require('../models/User');

let io;
const onlineUsers = new Set();

const setSocketServer = (socketServer) => {
  io = socketServer;
};

const getSocketServer = () => io;

const markOnline = (userId) => {
  onlineUsers.add(String(userId));
};

const markOffline = (userId) => {
  onlineUsers.delete(String(userId));
};

const isOnline = (userId) => onlineUsers.has(String(userId));

// Types whose `relatedId` is a Match _id — these respect the mute (MutedMatches) setting.
const MATCH_TIED_TYPES = ['new_message', 'match_request', 'match_accepted'];

const createNotification = async (userId, type, message, relatedId) => {
  // Respect per-connection mute: skip if the recipient muted this match.
  if (MATCH_TIED_TYPES.includes(type) && relatedId) {
    const recipient = await User.findById(userId).select('mutedMatches');
    if (recipient && (recipient.mutedMatches || []).some((m) => String(m) === String(relatedId))) {
      return null;
    }
  }
  const notification = await Notification.create({ user: userId, type, message, relatedId });
  io?.to(String(userId)).emit('new_notification', notification.toObject());
  return notification;
};

const isUserInRoom = (userId, roomId) => {
  const userSockets = io?.sockets.adapter.rooms.get(String(userId));
  if (!userSockets) return false;
  return [...userSockets].some((socketId) => io.sockets.sockets.get(socketId)?.rooms.has(String(roomId)));
};

module.exports = { createNotification, getSocketServer, isOnline, isUserInRoom, markOffline, markOnline, setSocketServer };
