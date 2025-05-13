const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Get user notifications
router.get('/', notificationController.getUserNotifications);

// Create notification
router.post('/create', notificationController.createNotification);

// Mark notification as read
router.put('/:notificationId/read', notificationController.markNotificationAsRead);

// Send task reminder
router.post('/tasks/:taskId/reminder', notificationController.sendTaskReminder);

module.exports = router; 