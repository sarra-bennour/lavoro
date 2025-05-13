const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    content: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 2000 
    },
    task_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'Task', 
        required: true 
    },
    user_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'user', 
        required: true 
    },
    attachments: [{
        url: String,
        filename: String,
        mimetype: String,
        size: Number
    }],
    created_at: { 
        type: Date, 
        default: Date.now 
    },
    updated_at: Date
});

// Add text index for search
CommentSchema.index({ content: 'text' });

module.exports = mongoose.model('Comment', CommentSchema);