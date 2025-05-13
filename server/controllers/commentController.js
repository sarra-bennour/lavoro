const Comment = require('../models/comment');
const Task = require('../models/Task');
const User = require('../models/user'); // This imports the 'user' model
const { isManager } = require('../middleware/roleChecker');


exports.createComment = async (req, res) => {
    try {
      const { task_id, content } = req.body;
      const user_id = req.user._id;

      // Validate task exists and populate project details
      const task = await Task.findById(task_id).populate('project_id');
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Get project details
      const project = task.project_id;
      if (!project) {
        return res.status(404).json({ error: 'Project not found for this task' });
      }

      // Check if user is a manager (Team Manager or Project Manager)
      const userIsManager = await isManager(user_id);
      if (!userIsManager) {
        return res.status(403).json({ error: 'Only managers can comment on tasks' });
      }

      // Get user details with role
      const user = await User.findById(user_id).populate('role');

      // Check if user has a role
      if (!user || !user.role) {
        return res.status(403).json({
          error: 'User role not found. Only managers can comment on tasks'
        });
      }

      // Check role permissions
      const roleName = user.role.RoleName;
      console.log('User role:', roleName);

      // Admin can always comment
      if (roleName === 'Admin') {
        // Admin can comment on any task
        console.log('User is Admin, allowing comment');
      }
      // Team Manager needs to be the manager of this project
      else if (roleName === 'Team Manager') {
        console.log('User is Team Manager, checking if assigned to project');
        // Check if the user is the team manager of this project
        if (!project.manager_id || !project.manager_id.equals(user_id)) {
          console.log('User is not the team manager of this project');
          return res.status(403).json({
            error: 'Only the team manager assigned to this project can comment on its tasks'
          });
        }
      }
      // Project Manager needs to be the project manager of this project
      else if (roleName === 'Project Manager') {
        console.log('User is Project Manager, checking if assigned to project');
        // Check if the user is the project manager of this project
        if (!project.ProjectManager_id || !project.ProjectManager_id.equals(user_id)) {
          console.log('User is not the project manager of this project');
          return res.status(403).json({
            error: 'Only the project manager assigned to this project can comment on its tasks'
          });
        }
      }
      // Other roles cannot comment
      else {
        console.log('User has role', roleName, 'which cannot comment');
        return res.status(403).json({
          error: 'Only project managers and team managers can comment on tasks'
        });
      }

      // Create and save the comment
      const comment = new Comment({
        content,
        task_id,
        user_id
      });

      await comment.save();

      // Add comment reference to task
      if (!task.comments) {
        task.comments = [];
      }
      task.comments.push(comment._id);
      await task.save();

      // Populate user details for immediate frontend display
      const populatedComment = await Comment.findById(comment._id)
        .populate({
          path: 'user_id',
          select: 'firstName lastName image role',
          populate: {
            path: 'role',
            select: 'RoleName'
          }
        });

      res.status(201).json(populatedComment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ error: error.message });
    }
  };

  exports.getTaskComments = async (req, res) => {
    try {
      const comments = await Comment.find({ task_id: req.params.taskId })
        .populate({
          path: 'user_id',
          select: 'firstName lastName image role',
          populate: {
            path: 'role',
            select: 'RoleName'
          }
        })
        .sort({ created_at: -1 });

      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  exports.updateComment = async (req, res) => {
    try {
      const { content } = req.body;
      const comment = await Comment.findOneAndUpdate(
        { _id: req.params.id, user_id: req.user._id },
        { content, updated_at: Date.now() },
        { new: true }
      ).populate({
        path: 'user_id',
        select: 'firstName lastName image role',
        populate: {
          path: 'role',
          select: 'RoleName'
        }
      });

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found or unauthorized' });
      }

      res.json(comment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  exports.deleteComment = async (req, res) => {
    try {
      const userId = req.user._id;

      // First check if user is manager
      const userIsManager = await isManager(userId);
      if (!userIsManager) {
        return res.status(403).json({ error: 'Only managers can delete comments' });
      }

      // Find the comment
      const comment = await Comment.findById(req.params.id);

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }

      // Check if the user is the creator of the comment
      if (!comment.user_id.equals(userId)) {
        // Get user role
        const user = await User.findById(userId).populate('role');

        // Check if user has a role
        if (!user || !user.role) {
          return res.status(403).json({
            error: 'User role not found. You can only delete your own comments'
          });
        }

        // Only allow Admin to delete other people's comments
        if (user.role.RoleName !== 'Admin') {
          console.log('User is not Admin and trying to delete someone else\'s comment');
          return res.status(403).json({
            error: 'You can only delete your own comments'
          });
        }

        console.log('User is Admin, allowing deletion of another user\'s comment');
      }

      // Delete the comment
      await Comment.findByIdAndDelete(req.params.id);

      // Remove comment reference from task
      await Task.findByIdAndUpdate(
        comment.task_id,
        { $pull: { comments: comment._id } }
      );

      res.json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: error.message });
    }
  };