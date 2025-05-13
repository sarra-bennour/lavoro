const profileController = require('../controllers/profileController');
const upload = require('../middleware/upload');
const express = require('express');
const router = express.Router();

// Get user profile
router.get('/profile', async (req, res) => {
    try {
      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      res.render('profile', { user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });


  // Update user profile
  router.post('/update', upload.single('image'), profileController.updateProfile);
  router.put('/update-password', profileController.updatePassword);


  router.get('/update', async (req, res) => {
    try {
        const user = req.session.user;
        if (!user) {
            return res.redirect('/users/signin');
        }
        res.render('updateProfile', { user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Request account deletion
router.post('/request-delete', profileController.requestDelete);
router.post('/enable-2fa', profileController.enable2FA);
router.post('/verify-2fa', profileController.verify2FA);
router.post('/disable-2fa', profileController.disable2FA);


module.exports = router;