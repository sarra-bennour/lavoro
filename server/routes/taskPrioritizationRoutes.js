const express = require('express');
const router = express.Router();
const taskPrioritizationController = require('../controllers/taskPrioritizationController');
const auth = require('../middleware/authenticatedToken');

// Route pour obtenir les tâches priorisées de l'utilisateur connecté
router.get('/my-tasks', 
    auth, 
    taskPrioritizationController.getPrioritizedTasks
);

// Route pour obtenir les tâches priorisées d'un projet
router.get('/project/:projectId', 
    auth, 
    taskPrioritizationController.getPrioritizedTasksForProject
);

// Route pour prioriser une liste de tâches fournie
router.post('/prioritize', 
    auth, 
    taskPrioritizationController.prioritizeTasks
);

module.exports = router;
