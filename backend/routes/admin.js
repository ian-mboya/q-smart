const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

// Protect all routes - only admins can access
router.use(protect, restrictTo('admin'));

// Dashboard stats
router.get('/dashboard-stats', adminCtrl.getDashboardStats);

// User management
router.get('/users', adminCtrl.getUsers);
router.post('/users', adminCtrl.createUser);
router.put('/users/:id', adminCtrl.updateUser);
router.delete('/users/:id', adminCtrl.deleteUser);

// System analytics
router.get('/analytics/system', adminCtrl.getSystemAnalytics);

module.exports = router;
