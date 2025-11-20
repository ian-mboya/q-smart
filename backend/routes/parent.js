const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const parentCtrl = require('../controllers/parentController');

const router = express.Router();

// All routes require authentication and parent role
router.use(protect);
router.use(restrictTo('parent'));

// Get parent's children
router.get('/my-children', parentCtrl.getMyChildren);

// Get all family tickets
router.get('/family-tickets', parentCtrl.getFamilyTickets);

// Add a child
router.post('/add-child', parentCtrl.addChild);

// Get specific child details
router.get('/children/:childId', parentCtrl.getChildDetails);

// Join queue for a child
router.post('/children/:childId/join-queue/:queueId', parentCtrl.joinQueueForChild);

// Get family analytics
router.get('/analytics', parentCtrl.getFamilyAnalytics);

module.exports = router;
