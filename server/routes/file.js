const express = require('express');
const router = express.Router();

const fileController = require('../controllers/fileController');
const authenticateUser = require('../middleware/mailAuth');

// Apply authentication middleware to all routes
router.use(authenticateUser);

// File upload
router.post('/upload', fileController.uploadFile);

// File sharing
router.post('/share/:fileId', fileController.shareFile);
router.get('/shared', fileController.getSharedFiles);

// File access
router.get('/file/:fileId', fileController.getFile);
router.get('/:fileId/details', fileController.getFileDetails);
router.patch('/:fileId/move', fileController.moveFile); // Add this line for move endpoint


// Folders
router.post('/folders/create', fileController.createFolder);
router.get('/folders', fileController.getUserFolders);
router.get('/folders/:folderId', fileController.getFolderContents);
router.post('/folders/share/:folderId', fileController.shareFolder);
router.delete('/:fileId', fileController.deleteFile);


module.exports = router;