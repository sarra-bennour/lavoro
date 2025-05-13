const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Notif = new Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        notification_text: { type: String, required: true },
        type: { type: String, required: true },
        is_read: { type: Boolean, default: false },
        created_at: { type: Date, default: Date.now },
        read_at: { type: Date },
        updated_at: { type: Date, default: Date.now },
        // Task specific fields
        task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
        task_title: { type: String },
        task_start_date: { type: Date },
        task_deadline: { type: Date },
        task_priority: { type: String },
        task_status: { type: String }
    }
);

module.exports = mongoose.model('notif', Notif); 