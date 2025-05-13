const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../public/uploads/chat');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Log the destination directory
        console.log('File destination directory:', uploadDir);

        // Ensure the directory exists
        if (!fs.existsSync(uploadDir)) {
            console.log('Creating upload directory:', uploadDir);
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate a unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + path.extname(file.originalname);

        console.log('Generated filename for upload:', filename);
        cb(null, filename);
    }
});

// File filter function to accept all file types
const fileFilter = (req, file, cb) => {
    console.log('Received file:', file.originalname, 'mimetype:', file.mimetype);
    // Accept all files
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit (increased from 10MB)
    }
});

// Direct message routes
router.get('/user/:userId', chatController.getUserChats);
router.get('/conversation/:userId/:otherUserId', chatController.getConversation);
router.post('/message', upload.single('attachment'), chatController.sendMessage);
router.delete('/message/:messageId', chatController.deleteMessage);

// Group chat routes
router.get('/groups/:userId', chatController.getUserGroups);
router.post('/group', upload.single('avatar'), chatController.createGroup);
router.get('/group/:groupId/:userId', chatController.getGroupMessages);
router.post('/group/message', upload.single('attachment'), chatController.sendGroupMessage);
router.delete('/group/message/:messageId', chatController.deleteGroupMessage);

// Group membership routes
router.put('/group/:groupId/add/:userId', chatController.addUserToGroup);
router.put('/group/:groupId/remove/:userId', chatController.removeUserFromGroup);

// Contacts route
router.get('/contacts/:userId', chatController.getContacts);

module.exports = router;
