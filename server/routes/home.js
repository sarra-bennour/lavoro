
const express = require('express');
const router = express.Router();

router.get('/home', (req, res) => {
  // Check if the user is authenticated
  if (!req.session.user) {
    return res.redirect('/users/signin'); // Redirect to sign-in if not authenticated
  }

  // Render the home page for authenticated users
  res.render('home', { user: req.session.user });
});

module.exports = router;

