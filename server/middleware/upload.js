const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the upload directories exist
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const imagesUserDir = path.join(__dirname, '../public/imagesUser');
const imagesAvatarDir = path.join(__dirname, '../public/imagesAvatar');

ensureDirectoryExists(imagesUserDir);
ensureDirectoryExists(imagesAvatarDir);

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesUserDir); // Save uploaded files to public/imagesUser
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname); // Add a unique prefix to avoid filename conflicts
  },
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // Accept the file
  } else {
    cb(new Error('Only image files are allowed!'), false); // Reject the file
  }
};

// Initialize multer
const upload = multer({ storage, fileFilter });

module.exports = upload;