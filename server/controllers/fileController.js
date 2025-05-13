const multer = require('multer');
const FileSharing = require('../models/FileSharing');
const Folder = require('../models/Folder');
const path = require('path');
const fs = require('fs');



const shareFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const { userIds, permission = 'view', makePublic = false } = req.body;

        const file = await FileSharing.findById(fileId);
        
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Check if the requester is the owner
        if (file.owner_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You are not the owner of this file' });
        }

        // Update sharing settings
        if (makePublic) {
            file.is_public = true;
            file.shared_with = []; // Clear individual shares if making public
        } else if (userIds && userIds.length > 0) {
            // Add new users to share with, avoiding duplicates
            userIds.forEach(userId => {
                if (!file.shared_with.some(share => share.user_id.toString() === userId)) {
                    file.shared_with.push({
                        user_id: userId,
                        permission: permission
                    });
                }
            });
            file.is_public = false;
        }

        await file.save();

        res.json({
            message: 'File sharing updated successfully',
            file
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getSharedFiles = async (req, res) => {
    try {
        // Files shared with the current user
        const sharedFiles = await FileSharing.find({
            $or: [
                { 'shared_with.user_id': req.user._id },
                { is_public: true }
            ]
        }).populate('owner_id', 'username email')
    .populate('folder_id', 'owner_id name');


        // Files owned by the current user
        const ownedFiles = await FileSharing.find({
            owner_id: req.user._id
        });

        res.json({
            sharedFiles,
            ownedFiles
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Configure local storage
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '');
        cb(null, `${Date.now()}_${sanitizedName}`);
    }
});



const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: (req, file, cb) => {
        cb(null, true);
    }
}).fields([{ name: 'file', maxCount: 1 }, { name: 'folder_id', maxCount: 1 }]);



const uploadFile = async (req, res) => {
    try {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }

            if (!req.files || !req.files.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const file = req.files.file[0];
            const folder_id = req.body.folder_id || null; // Get folder_id from body
            
            const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
            
            // Determine file type (keep your existing code here)
            let fileType = 'other';
            const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
            const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
            const audioExtensions = ['mp3', 'wav', 'ogg', 'aac'];
            const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
            const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];
            
            if (imageExtensions.includes(fileExtension)) fileType = 'image';
            else if (videoExtensions.includes(fileExtension)) fileType = 'video';
            else if (audioExtensions.includes(fileExtension)) fileType = 'audio';
            else if (documentExtensions.includes(fileExtension)) fileType = 'document';
            else if (archiveExtensions.includes(fileExtension)) fileType = 'archive';
            const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
            
            const newFile = new FileSharing({
                owner_id: req.user._id,
                file_name: file.originalname,
                file_url: fileUrl,
                file_path: file.path,
                file_size: file.size,
                file_extension: fileExtension,
                file_type: fileType,               
                 folder_id: folder_id // Make sure this is set
            });

            await newFile.save();
            res.status(201).json({ message: 'File uploaded successfully', file: newFile });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// const getFile = async (req, res) => {
//     try {
//         const { fileId } = req.params;

//         const file = await FileSharing.findById(fileId);
        
//         if (!file) {
//             return res.status(404).json({ error: 'File not found' });
//         }

//         // Check permissions
//         const isOwner = file.owner_id.toString() === req.user._id.toString();
//         const isShared = file.shared_with.some(share => share.user_id.toString() === req.user._id.toString());
//         const isPublic = file.is_public;

//         if (!isOwner && !isShared && !isPublic) {
//             return res.status(403).json({ error: 'You do not have permission to access this file' });
//         }

//         if (req.query.download === 'true') {
//             if (!fs.existsSync(file.file_path)) {
//                 return res.status(404).json({ error: 'File not found on server' });
//             }

//             // Get file stats for size and modified date
//             const stats = fs.statSync(file.file_path);
            
//             // Set headers
//             res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.file_name)}"`);
//             res.setHeader('Content-Type', 'application/octet-stream');
//             res.setHeader('Content-Length', stats.size);
//             res.setHeader('Last-Modified', stats.mtime.toUTCString());
//             res.setHeader('X-Content-Type-Options', 'nosniff');
            
//             // Handle range requests for partial downloads
//             const range = req.headers.range;
//             if (range) {
//                 const parts = range.replace(/bytes=/, "").split("-");
//                 const start = parseInt(parts[0], 10);
//                 const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
//                 const chunksize = (end - start) + 1;
                
//                 res.writeHead(206, {
//                     'Content-Range': `bytes ${start}-${end}/${stats.size}`,
//                     'Accept-Ranges': 'bytes',
//                     'Content-Length': chunksize
//                 });
                
//                 const fileStream = fs.createReadStream(file.file_path, { start, end });
//                 fileStream.pipe(res);
//             } else {
//                 const fileStream = fs.createReadStream(file.file_path);
//                 fileStream.pipe(res);
//             }
//         } else {
//             res.json({
//                 file,
//                 downloadUrl: `${req.protocol}://${req.get('host')}/files/file/${fileId}?download=true`
//             });
//         }
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };



const getFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const file = await FileSharing.findById(fileId);
        
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Check permissions
        const isOwner = file.owner_id.toString() === req.user._id.toString();
        const isShared = file.shared_with.some(share => share.user_id.toString() === req.user._id.toString());
        const isPublic = file.is_public;

        if (!isOwner && !isShared && !isPublic) {
            return res.status(403).json({ error: 'You do not have permission to access this file' });
        }

        if (req.query.download === 'true') {
            // Verify file exists on disk
            if (!fs.existsSync(file.file_path)) {
                return res.status(404).json({ error: 'File not found on server' });
            }

            // Set headers for download
            res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            
            // Create read stream and pipe to response
            const fileStream = fs.createReadStream(file.file_path);
            fileStream.pipe(res);
            
            fileStream.on('error', (err) => {
                console.error('File stream error:', err);
                res.status(500).end();
            });
        } else {
            res.json({
                file,
                downloadUrl: `${req.protocol}://${req.get('host')}/files/file/${fileId}?download=true`
            });

            console.log('File path:', file.file_path);
            console.log('File exists:', fs.existsSync(file.file_path));
        }

    } catch (error) {
        console.error('Error in getFile:', error);
        res.status(500).json({ error: error.message });
        console.log('File path:', file.file_path);
            console.log('File exists:', fs.existsSync(file.file_path));
    }
};

const getFileDetails = async (req, res) => {
    try {
      const { fileId } = req.params;
      const file = await FileSharing.findById(fileId)
        .populate('owner_id', 'firstName lastName email image')
        .populate('shared_with.user_id', 'firstName lastName email image');
  
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
  
      // Check permissions
      const isOwner = file.owner_id._id.toString() === req.user._id.toString();
      const isShared = file.shared_with.some(share => 
        share.user_id._id.toString() === req.user._id.toString()
      );
      const isPublic = file.is_public;
  
      if (!isOwner && !isShared && !isPublic) {
        return res.status(403).json({ error: 'Unauthorized access' });
      }
  
      res.json({ file });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };




// Create a new folder
const createFolder = async (req, res) => {
    try {
        const { name, parentFolder } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Folder name is required' });
        }

        // Check if folder with same name already exists in this location
        const existingFolder = await Folder.findOne({
            name: name.trim(),
            owner_id: userId,
            parent_folder: parentFolder || null
        });

        if (existingFolder) {
            return res.status(400).json({ error: 'A folder with this name already exists in this location' });
        }

        // Create new folder
        const newFolder = new Folder({
            name: name.trim(),
            owner_id: userId,
            parent_folder: parentFolder || null
        });

        await newFolder.save();

        res.status(201).json({
            success: true,
            message: 'Folder created successfully',
            folder: newFolder
        });
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create folder'
        });
    }
};

// Get all folders for a user
const getUserFolders = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const folders = await Folder.find({
            owner_id: userId,
            parent_folder: null // Get root folders by default
        }).populate('sub_folders');

        res.json({
            success: true,
            folders
        });
    } catch (error) {
        console.error('Error fetching folders:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch folders'
        });
    }
};

// Get folder contents (files and subfolders)
const getFolderContents = async (req, res) => {
    try {
        const { folderId } = req.params;
        const userId = req.user._id;

        // Verify folder exists and user has access
        const folder = await Folder.findOne({
            _id: folderId,
            $or: [
                { owner_id: userId },
                { shared_with: { $elemMatch: { user_id: userId } } }
            ]
        }).populate('sub_folders');

        if (!folder) {
            return res.status(404).json({
                success: false,
                error: 'Folder not found or access denied'
            });
        }

        // Get files in this folder
        const files = await FileSharing.find({
            folder_id: folderId,
            $or: [
                { owner_id: userId },
                { shared_with: { $elemMatch: { user_id: userId } } },
                { is_public: true }
            ]
        });

        res.json({
            success: true,
            folder,
            files
        });
    } catch (error) {
        console.error('Error fetching folder contents:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch folder contents'
        });
    }
};

// Share a folder
const shareFolder = async (req, res) => {
    try {
        const { folderId } = req.params;
        const { userIds, permission = 'view' } = req.body;
        const ownerId = req.user._id;

        // Verify folder exists and user is owner
        const folder = await Folder.findOne({
            _id: folderId,
            owner_id: ownerId
        });

        if (!folder) {
            return res.status(404).json({
                success: false,
                error: 'Folder not found or you are not the owner'
            });
        }

        // Update sharing settings
        userIds.forEach(userId => {
            // Check if already shared with this user
            const existingShare = folder.shared_with.find(share => 
                share.user_id.toString() === userId
            );

            if (!existingShare) {
                folder.shared_with.push({
                    user_id: userId,
                    permission: permission
                });
            }
        });

        await folder.save();

        res.json({
            success: true,
            message: 'Folder shared successfully',
            folder
        });
    } catch (error) {
        console.error('Error sharing folder:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to share folder'
        });
    }
};




const moveFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const { folderId } = req.body; // Make sure this is coming through

        const file = await FileSharing.findById(fileId);
        if (!file) return res.status(404).json({ error: 'File not found' });

        // Check permissions
        if (file.owner_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You are not the owner of this file' });
        }

        // If moving to a folder, verify it exists
        if (folderId) {
            const folder = await Folder.findById(folderId);
            if (!folder) {
                return res.status(404).json({ error: 'Folder not found' });
            }
        }

        // Update the file's folder_id
        file.folder_id = folderId || null;
        await file.save();

        res.json({
            success: true,
            message: 'File moved successfully',
            file
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const deleteFile = async (req, res) => {
    try {
        const { fileId } = req.params;

        const file = await FileSharing.findById(fileId);
        
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Check permissions - only owner can delete
        if (file.owner_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You are not the owner of this file' });
        }

        // Delete the physical file
        if (fs.existsSync(file.file_path)) {
            fs.unlinkSync(file.file_path);
        }

        // Delete the database record
        await FileSharing.findByIdAndDelete(fileId);

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { uploadFile ,shareFile, getSharedFiles , getFile , getFileDetails,createFolder,
    getUserFolders,
    getFolderContents,
    shareFolder,moveFile,deleteFile};



