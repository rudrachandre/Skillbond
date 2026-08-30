const express = require('express');
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const { getReports, getStats, getUsers, updateReportStatus, updateUserRole } = require('../controllers/adminController');

const router = express.Router();

router.use(protect, requireAdmin);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/reports', getReports);
router.patch('/reports/:reportId', updateReportStatus);
router.patch('/users/:userId/role', updateUserRole);

module.exports = router;
