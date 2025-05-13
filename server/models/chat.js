const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema(
    {
        sender_id: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        receiver_id: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        message: { type: String, required: false, default: '' },
        sent_at: { type: Date, default: Date.now },
        is_read: { type: Boolean, default: false },
        attachment: { type: String, default: null },
        attachment_type: { type: String, enum: ['image', 'file', 'video', 'pdf', 'word', 'excel', 'archive', null], default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model('chat', ChatSchema);
