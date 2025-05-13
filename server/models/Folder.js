const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FolderSchema = new Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    owner_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'user', 
        required: true 
    },
    parent_folder: { 
        type: Schema.Types.ObjectId, 
        ref: 'Folder'
        },
    sub_folders: [{
        type: Schema.Types.ObjectId,
        ref: 'Folder'
    }],
    shared_with: [{
        user_id: { 
            type: Schema.Types.ObjectId, 
            ref: 'user' 
        },
        permission: { 
            type: String, 
            enum: ['view', 'edit'], 
            default: 'view' 
        }
    }],
    created_at: { 
        type: Date, 
        default: Date.now 
    },
    updated_at: { 
        type: Date, 
        default: Date.now 
    }
});

// Update timestamps on save
FolderSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

// Cascade delete subfolders when a folder is deleted
FolderSchema.pre('remove', async function(next) {
    try {
        // Remove all subfolders
        await this.model('Folder').deleteMany({ parent_folder: this._id });
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('Folder', FolderSchema);