const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatGroupSchema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, default: '' },
        creator: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        members: [{ type: Schema.Types.ObjectId, ref: 'user' }],
        avatar: { type: String, default: null },
        is_active: { type: Boolean, default: true },
        last_message: { type: Date, default: Date.now }
    },
    { timestamps: true }
);

module.exports = mongoose.model('chatGroup', ChatGroupSchema);
