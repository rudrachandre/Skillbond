const express = require('express');
const { getSkillSuggestions } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/suggestions', protect, getSkillSuggestions);

module.exports = router;
