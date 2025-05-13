const express = require('express');
const router = express.Router();
const userSkillsController = require('../controllers/userSkillsController');

//router.post('/getSkillsByUserId', userSkillsController.getSkillsByUserId);
router.post('/getSkillsForMultipleUsers', userSkillsController.getSkillsForMultipleUsers);
router.post('/searchUsersBySkills', userSkillsController.searchUsersBySkills);

module.exports = router;