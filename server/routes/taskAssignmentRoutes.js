const express = require('express');
const router = express.Router();
const taskMatchingController = require('../controllers/taskAssignmentController');

router.get('/tasks/:taskId/matches', taskMatchingController.getTaskMatches);
// router.get('/tasks/:taskId/matches/fast', taskMatchingController.getTaskMatchesFast);
// router.post('/tasks/matching/train', taskMatchingController.trainModel);

module.exports = router;