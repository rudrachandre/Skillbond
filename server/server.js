const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const { createServer } = require('http');
const jwt = require('jsonwebtoken');
const path = require('path');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const creditRoutes = require('./routes/creditRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const matchRoutes = require('./routes/matchRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const Message = require('./models/Message');
const User = require('./models/User');
const { canAccessMatch } = require('./controllers/messageController');
const { createNotification, isUserInRoom, markOffline, markOnline, setSocketServer } = require('./utils/notify');
const sessionRoutes = require('./routes/sessionRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 5000;

   const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'https://skillbond-jet.vercel.app'];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins },
});
setSocketServer(io);

const markUserActive = (userId) => {
  User.updateOne({ _id: userId }, { lastActive: new Date() }).catch((error) => console.error(`lastActive update error: ${error.message}`));
};

io.use((socket, next) => {
  try {
    if (!process.env.JWT_SECRET) return next(new Error('JWT_SECRET is not configured'));
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication token is required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = { _id: decoded.userId };
    return next();
  } catch (error) {
    return next(new Error('Invalid or expired authentication token'));
  }
});

io.on('connection', (socket) => {
  const userId = String(socket.user._id);
  socket.join(userId);
  markOnline(userId);
  markUserActive(socket.user._id);

  socket.on('join_chat', async (matchId) => {
    try {
      const match = await canAccessMatch(matchId, socket.user._id);
      if (!match) return socket.emit('chat_error', 'Accepted match not found');
      socket.join(String(match._id));

      // Respect the "Restrict" feature: if the reader has restricted a sender,
      // that sender must NOT see read receipts for their messages. Fetch the
      // reader's restricted list and exclude those senders from read marking.
      const reader = await User.findById(socket.user._id).select('restrictedUsers');
      const restrictedSenders = (reader?.restrictedUsers || []).map(String);

      // Mark all messages in this match NOT sent by this user as read,
      // skipping any sender this user has restricted (so they don't get receipts).
      const result = await Message.updateMany(
        {
          matchId: match._id,
          sender: { $ne: socket.user._id, $nin: restrictedSenders },
          isRead: false,
        },
        { $set: { isRead: true } },
      );
      if (result.modifiedCount > 0) {
        // Notify the original sender(s) in the room (this socket is excluded by broadcast).
        socket.broadcast.to(String(match._id)).emit('messages_read', { matchId: String(match._id) });
      }
    } catch (error) {
      socket.emit('chat_error', 'Unable to join chat');
    }
  });

  socket.on('leave_chat', (matchId) => {
    socket.leave(String(matchId));
  });

  socket.on('send_message', async ({ matchId, content, attachmentUrl, attachmentType, clientMessageId }) => {
    try {
      const cleanContent = content?.trim();
      const match = await canAccessMatch(matchId, socket.user._id);
      if (!match) return socket.emit('chat_error', 'Accepted match not found');
      const hasAttachment = Boolean(attachmentUrl) && ['image', 'audio'].includes(attachmentType);
      if (!cleanContent && !hasAttachment) return socket.emit('chat_error', 'Message cannot be empty');

      const message = await Message.create({
        matchId: match._id,
        sender: socket.user._id,
        content: cleanContent || '',
        ...(hasAttachment ? { attachmentUrl, attachmentType } : {}),
      });

      io.to(String(match._id)).emit('receive_message', {
        ...message.toObject(),
        sender: String(socket.user._id),
        clientMessageId,
      });
      const recipientId = match.userA.toString() === socket.user._id.toString() ? match.userB : match.userA;
      if (!isUserInRoom(recipientId, match._id)) createNotification(recipientId, 'new_message', 'You received a new message', match._id.toString()).catch((error) => console.error(`Message notification error: ${error.message}`));
    } catch (error) {
      socket.emit('chat_error', 'Unable to send message');
    }
  });

  const relayTyping = (eventName) => async (matchId) => {
    try {
      const match = await canAccessMatch(matchId, socket.user._id);
      if (!match) return;
      // Relay only to the other participant in this specific chat room,
      // excluding the sender (broadcast to the room does not hit this socket).
      socket.broadcast.to(String(match._id)).emit(eventName, { matchId: String(match._id), userId: String(socket.user._id) });
    } catch (error) {
      // Ignore relay errors (non-critical typing signal).
    }
  };

  socket.on('typing', relayTyping('typing'));
  socket.on('stop_typing', relayTyping('stop_typing'));

  socket.on('disconnect', () => {
    const disconnectingId = String(socket.user._id);
    markOffline(disconnectingId);
    markUserActive(socket.user._id);
    console.log(`Chat socket disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
