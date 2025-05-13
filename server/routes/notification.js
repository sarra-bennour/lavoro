// // notifications.js router
// const express = require('express');
// const router = express.Router();
// const Notification = require('../models/notif');

// // In your notifications.js router
// router.get('/', async (req, res) => {
//   try {
//     if (!req.user || !req.user._id) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }

//     const notifications = await Notification.find({ 
//       user_id: req.user._id 
//     })
//     .sort({ created_at: -1 })
//     .limit(10)
//     .lean(); // Use lean() for better performance

//     const unreadCount = await Notification.countDocuments({
//       user_id: req.user._id,
//       is_read: false
//     });

//     res.json({ notifications, unreadCount });
//   } catch (error) {
//     console.error('Error fetching notifications:', error);
//     res.status(500).json({ 
//       message: 'Error fetching notifications', 
//       error: error.message 
//     });
//   }
// });



const express = require('express');
const router = express.Router();
const Notification = require('../models/notif');
const jwt = require('jsonwebtoken');

// Modified GET /notifications route
router.get('/', async (req, res) => {
  try {
    // First verify the token and get user info
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Now fetch notifications for this user
    const notifications = await Notification.find({ 
      user_id: decoded._id // Use the decoded _id from token
    })
    .sort({ created_at: -1 })
    .limit(10);

    const unreadCount = await Notification.countDocuments({
      user_id: decoded._id,
      is_read: false
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// In notifications.js router
// router.post('/:id/mark-read', async (req, res) => {
//     try {
//       const notification = await Notification.findByIdAndUpdate(
//         req.params.id,
//         { 
//           is_read: true,
//           read_at: new Date() 
//         },
//         { new: true }
//       );
      
//       res.json(notification);
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   });


router.post('/:id/mark-read', async (req, res) => {
  try {
    // Verify token first
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the token (but we don't need the user info here)
    jwt.verify(token, process.env.JWT_SECRET);

    // Proceed with marking as read
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { 
        is_read: true,
        read_at: new Date() 
      },
      { new: true }
    );
    
    res.json(notification);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;





// router.get('/', async (req, res) => {
//     try {
//       if (!req.user || !req.user._id) {
//         return res.status(401).json({ message: 'Unauthorized' });
//       }
  
//       const notifications = await Notification.find({ 
//         user_id: req.user._id 
//       })
//       .sort({ created_at: -1 })
//       .limit(10)
  
//       const unreadCount = await Notification.countDocuments({
//         user_id: req.user._id,
//         is_read: false
//       });
  
//       res.json({ notifications, unreadCount });
//     } catch (error) {
//       console.error('Error fetching notifications:', error);
//       res.status(500).json({ message: 'Error fetching notifications', error: error.message });
//     }
//   });

