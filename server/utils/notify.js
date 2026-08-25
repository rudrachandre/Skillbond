const Notification = require('../models/Notification');

let io;

const setSocketServer = (socketServer) => {
  io = socketServer;
};

const createNotification = async (userId, type, message, relatedId) => {
  const notification = await Notification.create({ user: userId, type, message, relatedId });
  io?.to(String(userId)).emit('new_notification', notification.toObject());
  return notification;
};

const isUserInRoom = (userId, roomId) => {
  const userSockets = io?.sockets.adapter.rooms.get(String(userId));
  if (!userSockets) return false;
  return [...userSockets].some((socketId) => io.sockets.sockets.get(socketId)?.rooms.has(String(roomId)));
};

module.exports = { createNotification, isUserInRoom, setSocketServer };
