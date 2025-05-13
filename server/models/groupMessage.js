const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GroupMessageSchema = new Schema(
    {
        group_id: { type: Schema.Types.ObjectId, ref: 'chatGroup', required: true },
        sender_id: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        message: { type: String, required: false, default: '' },
        sent_at: { type: Date, default: Date.now },
        read_by: [{ type: Schema.Types.ObjectId, ref: 'user' }],
        attachment: { type: String, default: null },
        attachment_type: { type: String, enum: ['image', 'file', 'video', 'pdf', 'word', 'excel', 'archive', null], default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model('groupMessage', GroupMessageSchema);
