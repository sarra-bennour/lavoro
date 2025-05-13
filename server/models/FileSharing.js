const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FileSharing = new Schema(
    {
        owner_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user' },
        file_name: { type: String, required: true },
        file_url: { type: String, required: true },
        shared_with: [{ 
            user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
            permission: { type: String, enum: ['view', 'edit'], default: 'view' }
        }],
        folder_id: {type: mongoose.Schema.Types.ObjectId , ref: 'Folder'},
        uploaded_at: { type: Date, default: Date.now },
        file_size: { type: Number, required: true },
        file_extension: { type: String, required: true },
        file_type: { 
            type: String, 
            required: true,
            enum: ['image', 'video', 'audio', 'document', 'archive', 'other'] 
        },
        is_public: { type: Boolean, default: true },
        
    },
    { timestamps: true }
);

module.exports = mongoose.model('FileSharing', FileSharing);