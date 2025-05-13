const notificationUtils = require('../utils/notification');
const Notification = require('../models/notif');
const mongoose = require('mongoose');
const Task = mongoose.models.Task || require('../models/task');

const notificationController = {
    createNotification: async (req, res) => {
        try {
            const { userId, task } = req.body;

            if (!userId || !task) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields'
                });
            }

            const notification = await notificationUtils.createTaskAssignmentNotification(userId, task);

            res.status(201).json({
                success: true,
                data: notification,
                message: 'Notification created successfully'
            });
        } catch (error) {
            console.error('Error in createNotification:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error creating notification'
            });
        }
    },

    getUserNotifications: async (req, res) => {
        try {
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const notifications = await Notification.find({ user_id: userId })
                .sort({ created_at: -1 })
                .limit(50);

            res.status(200).json({
                success: true,
                data: notifications
            });
        } catch (error) {
            console.error('Error in getUserNotifications:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error fetching notifications'
            });
        }
    },

    markNotificationAsRead: async (req, res) => {
        try {
            const { notificationId } = req.params;
            const { userId } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const notification = await Notification.findOneAndUpdate(
                { _id: notificationId, user_id: userId },
                { 
                    is_read: true,
                    read_at: new Date()
                },
                { new: true }
            );

            if (!notification) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            res.status(200).json({
                success: true,
                data: notification,
                message: 'Notification marked as read'
            });
        } catch (error) {
            console.error('Error in markNotificationAsRead:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Error marking notification as read'
            });
        }
    },

    sendTaskReminder: async (req, res) => {
        try {
            const { taskId } = req.params;
            const task = await Task.findById(taskId).populate({
                path: 'assigned_to',
                populate: {
                    path: 'user_id',
                    select: '_id'
                }
            });
            
            if (!task) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Task not found' 
                });
            }

            if (!task.assigned_to || task.assigned_to.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No team members assigned to this task'
                });
            }

            const userId = task.assigned_to[0].user_id._id;
            const notification = await notificationUtils.createTaskReminderNotification(task, userId);
            
            res.status(200).json({ 
                success: true,
                message: 'Task reminder sent successfully',
                data: notification 
            });
        } catch (error) {
            console.error('Error sending task reminder:', error);
            res.status(500).json({ 
                success: false,
                message: error.message || 'Error sending task reminder' 
            });
        }
    }
};

module.exports = notificationController; 