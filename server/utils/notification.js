const Notification = require('../models/notif'); 

const createNotification = async (userId, text, type, taskData = null) => {
  try {
    const notificationData = {
      user_id: userId,
      notification_text: text,
      type: type,
    };

    // Add task data if provided
    if (taskData) {
      notificationData.task_id = taskData._id;
      notificationData.task_title = taskData.title;
      notificationData.task_start_date = taskData.start_date;
      notificationData.task_deadline = taskData.deadline;
      notificationData.task_priority = taskData.priority;
      notificationData.task_status = taskData.status;
    }

    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

const createTaskAssignmentNotification = async (userId, task) => {
  const notificationText = `You have been assigned to task: ${task.title}
Start Date: ${task.start_date}
End Date: ${task.deadline}
Priority: ${task.priority}
Status: ${task.status}`;
  
  return createNotification(userId, notificationText, 'TASK_ASSIGNMENT', task);
};

const createTaskReminderNotification = async (task, assignedTo) => {
  try {
    const notification = new Notification({
      user_id: assignedTo,
      type: 'TASK_REMINDER',
      notification_text: `Task "${task.title}" is due on ${new Date(task.deadline).toLocaleDateString()}`,
      task_id: task._id,
      task_title: task.title,
      task_start_date: task.start_date,
      task_deadline: task.deadline,
      task_priority: task.priority,
      task_status: task.status,
      is_read: false,
      created_at: new Date()
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating task reminder notification:', error);
    throw error;
  }
};

module.exports = {
  createNotification,
  createTaskAssignmentNotification,
  createTaskReminderNotification
};