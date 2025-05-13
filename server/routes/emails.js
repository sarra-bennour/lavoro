
const emailController = require('../controllers/emailController');
const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/mailAuth');


router.get('/emails', authenticateUser, emailController.getEmails);
router.get('/emails/:id', authenticateUser ,emailController.getEmailById);
router.patch('/emails/:emailId/star', authenticateUser, emailController.toggleStarEmail);
router.patch('/emails/:emailId/archive', authenticateUser, emailController.toggleArchiveEmail);
router.delete('/emails/:emailId', authenticateUser, emailController.deleteEmail);


module.exports = router; 
