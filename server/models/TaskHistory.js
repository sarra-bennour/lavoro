const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const TaskHistory = new Schema({
    task_id: { type: Schema.Types.ObjectId, required: true },
    changed_by: { type:  Schema.Types.ObjectId, required: true },
    change_type: {
        type: String,
        enum: ['Status Update', 'Priority Change', 'Assignment Change'],
        required: true
    },
    old_value: { type: String, required: true },
    new_value: { type: String, required: true },
    changed_at: { type: Date, default: Date.now },
    // Champs additionnels pour le suivi des performances
    completion_type: {
        type: String,
        enum: ['early', 'on_time', 'late', 'not_applicable'],
        default: 'not_applicable'
    },
    hours_difference: { type: Number, default: 0 }, // Nombre d'heures d'avance ou de retard
    points_earned: { type: Number, default: 0 } // Points gagnés ou perdus
});
module.exports = mongoose.model('taskHistory', TaskHistory);
