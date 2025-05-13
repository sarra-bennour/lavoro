const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middleware/upload'); // Import the upload middleware
const setDefaultRole = require('../middleware/setDefaultRole');
const { googleLogin } = require('../controllers/authController');
const { MicrosoftLogin } = require('../controllers/MicrosoftController');
const { GitHubLogin, getData } = require('../controllers/GitHubController');
const authenticateToken = require('../middleware/authenticatedToken');

const TaskController = require('../controllers/TaskController');


router.get('/all' , userController.getUsers)

router.post('/signup', setDefaultRole, upload.single('image'), userController.signup);


router.post('/signin', userController.signin);

  router.get('/check-email', userController.checkmail);

  router.post('/logout', userController.logout);


router.get('/me', userController.getUserInfo); // Route to get user info from session



router.get('/signin', userController.redirectIfAuthenticated, (req, res) => {
  res.render('signin'); // Render sign-in page
});

router.get('/signup', userController.redirectIfAuthenticated, (req, res) => {
  res.render('signup'); // Render sign-up page
});

router.get('/home', userController.redirectIfNotAuthenticated, (req, res) => {
  res.render('home'); // Render home page
});

router.get('/verify-email', userController.verifyEmail);




router.post('/request-reset', userController.forgotPassword);

router.get('/resetpassword', (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token is missing.' });
  }

  res.status(200).json({ token });
});

router.post('/resetpassword', userController.resetPassword);


router.post('/seedtasks', async (req, res) => {
    try {
        await seedTasks();
        res.status(200).json({ message: 'Tasks seeded successfully!' });
    } catch (error) {
        res.status(500).json({ error: 'Error seeding tasks' });
    }
});

router.get('/tasks/:userId', TaskController.getTasksByUser);
router.get('/mytasks', authenticateToken, TaskController.getTasksByUser);

router.post('/verify2FALogin', userController.verify2FALogin);


router.get("/google", googleLogin);
router.post('/login', MicrosoftLogin);
/*router.get('/get-user', getUser);*/
router.post('/github', GitHubLogin);
router.get('/getData', getData);

router.get('/getTeamManager', userController.getTeamManager);

router.get('/getAllDev', userController.getAllDev);
router.get('/searchDevsByName', userController.searchDevsByName);
router.get('/getAllDevelopers', userController.getAllDevelopers);

// Route pour récupérer le meilleur performeur
router.get('/best-performer', authenticateToken, userController.getBestPerformer);

// Route pour récupérer les meilleurs performeurs (top 5 par défaut)
router.get('/top-performers', authenticateToken, userController.getTopPerformers);

module.exports = router;