const express = require('express');
const router = express.Router();
const skillsController = require('../controllers/skillsController');

router.get('/getSkills', skillsController.getAllSkills);

module.exports = router;
