const express = require('express');
const router = express.Router();
const analyticsCtrl = require('../controllers/analyticsController');
const { protect, restrictTo } = require('../middleware/auth');

// GET /api/analytics/teacher
router.get('/teacher', protect, restrictTo('teacher','admin'), analyticsCtrl.getTeacherAnalytics);

// GET /api/analytics/student
router.get('/student', protect, restrictTo('student','admin'), analyticsCtrl.getStudentAnalytics);

// GET /api/analytics/parent
router.get('/parent', protect, restrictTo('parent','admin'), analyticsCtrl.getParentAnalytics);

module.exports = router;