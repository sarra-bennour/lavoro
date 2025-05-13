const User = require('../models/user'); 
const Role = require('../models/role'); 
const Project = require('../models/Project');

const AccountActivityLog = require('../models/accountActivityLog');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const sendEmail = require('../utils/email');



exports.getAdminDashboard = async (req, res) => {
  try {
    // Check if the user is authenticated and is an admin
    if (!req.session.user || req.session.user.role.RoleName !== 'Admin') {
      return res.status(403).json({ error: 'Unauthorized. Only admins can access this page.' });
    }

    // Fetch all users and populate their roles, then filter out admins
    const users = await User.find().populate('role', 'RoleName');
    const filteredUsers = users.filter(user => user.role.RoleName !== 'Admin');
    
    const roles = await Role.find();

    // Return the data as JSON (without admin users)
    res.status(200).json({ users: filteredUsers, roles });
  } catch (error) {
    console.error('Error fetching users for admin dashboard:', error);
    res.status(500).json({ error: 'An error occurred while fetching user data.' });
  }
};


exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role: newRoleId } = req.body;

    // 1. Validate inputs
    if (!mongoose.Types.ObjectId.isValid(newRoleId)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid Role ID',
        message: 'Please provide a valid role ID'
      });
    }

    // 2. Fetch current user and new role
    const [currentUser, newRole] = await Promise.all([
      User.findById(userId).populate('role'),
      Role.findById(newRoleId)
    ]);

    if (!currentUser || !newRole) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: currentUser ? 'Role not found' : 'User not found'
      });
    }

    // 3. Check role hierarchy (prevent downgrades)
    if (newRole.hierarchyLevel < currentUser.role.hierarchyLevel) {
      return res.status(400).json({
        success: false,
        error: 'Hierarchy Violation',
        message: `Cannot change from ${currentUser.role.RoleName} to ${newRole.RoleName}`,
        currentRole: currentUser.role.RoleName,
        newRole: newRole.RoleName
      });
    }

    // 4. Special validation for Team Manager → Project Manager transition
    if (currentUser.role.RoleName === 'Team Manager' && newRole.RoleName === 'Project Manager') {
      const activeProjects = await Project.find({
        $or: [
          { manager_id: userId },
          { team_members: userId }
        ],
        status: { $in: ['Not Started', 'In Progress'] }
      }).select('name status _id');

      if (activeProjects.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Active Projects Exist',
          message: 'Cannot change role while assigned to active projects',
          projects: activeProjects.map(p => ({
            id: p._id,
            name: p.name,
            status: p.status
          })),
          requiredAction: 'reassign-projects'
        });
      }
    }

    // 5. Only proceed with update if all validations pass
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: newRoleId },
      { new: true }
    ).populate('role').select('-password');

    return res.status(200).json({
      success: true,
      user: updatedUser,
      message: `Role updated to ${newRole.RoleName} successfully`
    });

  } catch (error) {
    console.error('Role update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};

exports.getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;

    const activityLogs = await AccountActivityLog.find({ userId })
      .sort({ timestamp: -1 })
      .populate({
        path: 'userId',
        select: 'firstName lastName email image' // Make sure to include image here
      });

    res.status(200).json({ activityLogs });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Error fetching activity logs.' });
  }
};



exports.getDeleteRequests = async (req, res) => {
  try {
    const deleteRequests = await Notification.find({ type: 'delete_request', status: 'pending' })
      .populate({
        path: 'triggered_by',
        select: 'firstName lastName email image' // Make sure to include 'image' here
      });

    console.log('Raw delete requests:', deleteRequests);
    res.status(200).json(deleteRequests);
  } catch (error) {
    console.error('Error fetching delete requests:', error);
    res.status(500).json({ error: 'Error fetching delete requests.' });
  }
};

exports.handleDeleteRequest = async (req, res) => {
  try {
    const { notificationId, action } = req.body;
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    if (notification.status !== 'pending') {
      return res.status(400).json({ error: 'This request has already been processed.' });
    }

    if (action === 'approve') {
      // Check if user is a team manager with active projects
      const user = await User.findById(notification.triggered_by).populate('role');
      const isTeamManager = user.role?.RoleName === 'Team Manager';
      
      if (isTeamManager) {
        const activeProjects = await Project.find({
          manager_id: notification.triggered_by,
          status: { $in: ['Not Started', 'In Progress'] }
        });

        if (activeProjects.length > 0) {
          return res.status(400).json({ 
            error: 'Cannot approve - this team manager has projects in progress or not started.' 
          });
        }
      }

      // Proceed with deletion if checks pass
      await User.findByIdAndDelete(notification.triggered_by);
      notification.status = 'approved';
    } else if (action === 'reject') {
      notification.status = 'rejected';
    } else {
      return res.status(400).json({ error: 'Invalid action.' });
    }

    await notification.save();
    res.status(200).json({ message: `Request ${action}ed successfully.` });
  } catch (error) {
    console.error('Error handling delete request:', error);
    res.status(500).json({ error: 'Error handling delete request.' });
  }
};


exports.getRoleStatistics = async (req, res) => {
  try {
    const roles = await Role.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'role',
          as: 'users'
        }
      },
      {
        $project: {
          RoleName: 1,
          userCount: { $size: '$users' }
        }
      },
      {
        $match: {
          RoleName: { $not: /admin/i } 
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: roles,
      message: 'Role statistics fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching role statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching role statistics',
      error: error.message
    });
  }
};


exports.getUsersForEmail = async (req, res) => {
  try {
    const users = await User.find({})
      .populate('role', 'RoleName')
      .select('email firstName lastName role')
      .lean();

    const nonAdminUsers = users.filter(user => {
      const roleName = (user.role?.RoleName || '').trim().toLowerCase();
      return roleName !== 'admin';
    });

    res.status(200).json({
      success: true,
      data: nonAdminUsers
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


exports.sendBulkEmail = async (req, res) => {
  try {
    const { to, subject, content } = req.body;

    // Validation
    if (!Array.isArray(to) || to.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one recipient is required'
      });
    }

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Subject and content are required'
      });
    }

    // Send emails
    const emailPromises = to.map(email => 
      sendEmail(
        email,
        subject,
        content.replace(/<[^>]*>/g, ''), // Plain text version
        content // HTML version
      )
    );

    await Promise.all(emailPromises);

    res.status(200).json({
      success: true,
      message: 'Emails sent successfully',
      count: to.length
    });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emails',
      error: error.message
    });
  }
};


exports.getUpcomingDeadlines = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const projects = await Project.find({
      end_date: { 
        $lte: nextMonth,
        $gte: today
      },
      status: { $ne: "Completed" }
    })
    .populate('manager_id', 'firstName lastName email') // Changed to manager_id
    .sort({ end_date: 1 })
    .lean();

    const formattedProjects = projects.map(project => {
      const managerName = project.manager_id
        ? `${project.manager_id.firstName} ${project.manager_id.lastName}`
        : 'Unassigned';

      return {
        ...project,
        _id: project._id.toString(),
        end_date: project.end_date.toISOString(),
        manager: managerName, // Frontend expects this field
        manager_email: project.manager_id?.email || null
      };
    });

    res.status(200).json({ 
      success: true,
      data: formattedProjects,
      meta: {
        count: formattedProjects.length,
        date_range: {
          start: today.toISOString(),
          end: nextMonth.toISOString()
        }
      }
    });

  } catch (error) {
    console.error("Deadline fetch error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch deadlines",
      details: error.message
    });
  }
};


const sendDeadlineReminderWithTracking = async (project, senderUserId) => {
  try {
    const endDate = new Date(project.end_date);
    endDate.setHours(23, 59, 59, 999); // End of the day
    
    const today = new Date();
    const timeDiff = endDate - today;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    const emailText = `Dear ${project.manager_id.firstName},\n\n` +
                     `This is a reminder that your project "${project.name}" is due on ${endDate.toDateString()}.\n\n` +
                     `Only ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining.\n\n` +
                     `Please ensure all tasks are completed on time.\n\n` +
                     `Best regards,\nYour Project Management Team`;

    const mailData = {
      from: `LAVORO Reminders <${process.env.EMAIL_USER || 'no-reply@example.com'}>`,
      to: project.manager_id.email,
      subject: `Urgent: ${project.name} Deadline Approaching (${endDate.toDateString()})`,
      text: emailText,
      relatedProject: project._id,
      direction: 'sent',
      senderUserId: senderUserId,
      receiverUserId: project.manager_id._id
    };

    // Store sender's copy
    const sentEmail = await storeEmail(mailData);

    // Store receiver's copy
    const receivedEmailData = {
      ...mailData,
      direction: 'received'
    };
    await storeEmail(receivedEmailData);

    return {
      email: sentEmail,
      daysRemaining
    };
  } catch (error) {
    console.error('Error in deadline reminder with tracking:', error);
    throw error;
  }
};

exports.sendDeadlineReminder = async (req, res) => {
  try {
    const { projectId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14); // Exactly 14 days from today
    twoWeeksLater.setHours(23, 59, 59, 999); // End of the day

    // 2. Fetch Project
    const project = await Project.findById(projectId)
      .populate('manager_id', 'email firstName lastName');
    
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    // 3. Deadline Validation
    if (project.end_date > twoWeeksLater) {
      const daysRemaining = Math.ceil((project.end_date - today) / (1000 * 60 * 60 * 24));
      return res.status(400).json({
        success: false,
        message: 'Project deadline is not within two weeks',
        daysRemaining
      });
    }

    // Calculate days remaining (more accurate check)
    const endDate = new Date(project.end_date);
    endDate.setHours(23, 59, 59, 999); // End of the day
    
    const timeDiff = endDate - today;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (daysRemaining > 14) {
      return res.status(400).json({
        success: false,
        message: 'Project deadline is not within two weeks',
        daysRemaining
      });
    }

    const emailText = `Dear ${project.manager_id.firstName},\n\n` +
                     `This is a reminder that your project "${project.name}" is due on ${endDate.toDateString()}.\n\n` +
                     `Only ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'} remaining.\n\n` +
                     `Please ensure all tasks are completed on time.\n\n` +
                     `Best regards,\nYour Project Management Team`;

    await sendEmail(
      project.manager_id.email,
      `Urgent: ${project.name} Deadline Approaching (${endDate.toDateString()})`,
      emailText
    );

    res.status(200).json({ 
      success: true,
      message: 'Reminder email sent successfully',
      data: {
        projectId: project._id,
        managerEmail: project.manager_id.email,
        daysRemaining
      }
    });
  } catch (error) {
    console.error('Error sending deadline reminder:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error sending reminder email',
      error: error.message
    });
  }
};