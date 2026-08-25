const express = require('express');
const { login, register, userData } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, (req, res) => {
  res.json({
    success: true,
    message: 'Authenticated user retrieved',
    data: { user: userData(req.user) },
  });
});

module.exports = router;
