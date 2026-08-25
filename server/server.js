const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const { createServer } = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const matchRoutes = require('./routes/matchRoutes');
const Message = require('./models/Message');
const { canAccessMatch } = require('./controllers/messageController');
const sessionRoutes = require('./routes/sessionRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins },
});

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
  socket.on('join_chat', async (matchId) => {
    try {
      const match = await canAccessMatch(matchId, socket.user._id);
      if (!match) return socket.emit('chat_error', 'Accepted match not found');
      socket.join(String(match._id));
    } catch (error) {
      socket.emit('chat_error', 'Unable to join chat');
    }
  });

  socket.on('send_message', async ({ matchId, content, clientMessageId }) => {
    try {
      const cleanContent = content?.trim();
      const match = await canAccessMatch(matchId, socket.user._id);
      if (!match) return socket.emit('chat_error', 'Accepted match not found');
      if (!cleanContent) return socket.emit('chat_error', 'Message cannot be empty');

      const message = await Message.create({
        matchId: match._id,
        sender: socket.user._id,
        content: cleanContent,
      });

      io.to(String(match._id)).emit('receive_message', {
        ...message.toObject(),
        sender: String(socket.user._id),
        clientMessageId,
      });
    } catch (error) {
      socket.emit('chat_error', 'Unable to send message');
    }
  });

  socket.on('disconnect', () => {
    console.log(`Chat socket disconnected: ${socket.id}`);
  });
});

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
