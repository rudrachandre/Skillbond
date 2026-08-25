const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const matchRoutes = require('./routes/matchRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
