const express = require('express');
const router = express.Router();
const auth = require('../middleware/authenticatedToken');
const { isManager } = require('../middleware/roleChecker');
const { seedTasks, seedTaskHistory,getTasksByUser } = require('../controllers/TaskController');


const taskController = require('../controllers/TaskController')
const authenticateUser = require('../middleware/mailAuth');
const commentController = require('../controllers/commentController');


router.post('/createTask', authenticateUser, taskController.addTask);
router.get('/', authenticateUser, taskController.getAllTasks);
router.delete('/:taskId', taskController.deleteTask);
router.patch('/:taskId/assign', taskController.assignTask);
router.patch('/:taskId/unassign', taskController.unassignTask);
router.get('/task/:taskId',  taskController.getTaskById);
router.get('/my-tasks', authenticateUser, taskController.getMyTasks);
router.patch('/:taskId/start', authenticateUser, taskController.startTask);
router.patch('/:taskId/complete', authenticateUser, taskController.completeTask);
router.get('/getTaskByIdMember/:id', taskController.getTaskByIdMember);
router.get('/getTasksList/:userId', taskController.getTasksList);
router.put('/updateCalendarDates/:taskId', taskController.updateTaskCalendarDates);
router.post('/confirm-assignment', taskController.confirmAssignment);
router.get('/my-tasks/:teamMemberId', authenticateUser, taskController.getTasksByTeamMember);


router.post('/:id/export-to-github', auth, taskController.exportToGitHub);



router.post('/seedtasks', async (req, res) => {
    try {
        await seedTasks();
        res.status(200).json({ message: 'Tasks seeded successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error seeding tasks' });
    }
});

router.post('/seed-task-history', async (req, res) => {
    try {
        await seedTaskHistory();
        res.status(200).json({ message: 'Task history seeded successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error seeding task history' });
    }
});
router.get('/getTasksByUser/:userId', getTasksByUser);
router.get('/my-tasks', auth, taskController.getTasksByUser);


router.patch('/:taskId/status',
    auth, // Protection de la route
    taskController.updateTaskStatus
);

// Route pour tester le système de points
router.post('/test-points-system/:userId',
    auth, // Protection de la route
    taskController.testPointsSystem
);

router.post('/generateAITasks/:projectId', auth,taskController.generateTasksForProject);
router.post('/generateAITasks',auth, taskController.generateTasksWithProject);

// New routes for separated generation and saving
router.post('/generateTasksOnly/:projectId', auth, taskController.generateTasksOnly);
router.post('/generateTasksOnly', auth, taskController.generateTasksOnly);
router.post('/saveTasks', auth, taskController.saveTasks);
router.get('/projects/:projectId/kanban', auth, taskController.getKanbanTasks);
router.patch('/:taskId/status', auth, taskController.updateTaskStatus);
router.post('/update-orders', auth, taskController.updateTaskOrders);

// Comment routes
router.post('/comment', auth, commentController.createComment);
router.get('/getComments/:taskId', auth, commentController.getTaskComments);
router.put('/updateComment/:id', auth, commentController.updateComment);
router.delete('/deleteComment/:id', auth, commentController.deleteComment);

// Check if user is a manager
router.get('/check-manager-role', auth, async (req, res) => {
    try {
      const userId = req.user._id;
      const isUserManager = await isManager(userId);
      res.json({ isManager: isUserManager });
    } catch (error) {
      console.error('Error checking manager role:', error);
      res.status(500).json({ error: 'Error checking role' });
    }
  });

  router.get('/developer-dashboard', auth, taskController.getDeveloperDashboard);
  // routes/task.js
router.get('/developer-kanban', auth, taskController.getDeveloperKanbanTasks);

module.exports = router;