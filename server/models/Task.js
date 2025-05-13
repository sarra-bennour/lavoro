const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    project_id: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    assigned_to: [{ type: Schema.Types.ObjectId, ref: 'teamMember' , required: false }],
    created_by: { type: Schema.Types.ObjectId, ref: 'user' , required: false },
    status: { type: String, enum: ['Not Started', 'In Progress', 'In Review', 'Done'], default: 'Not Started' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    deadline: { type: Date },
    start_date: { type: Date },
    completion_date: { type: Date }, // Date à laquelle la tâche a été complétée
    estimated_duration: { type: Number },
    tags: [{ type: String }],
    requiredSkills: [{ type: String, required: true }],
    created_at: { type: Date, default: Date.now },
    score : { type: Number, default: 4.5 },

});

module.exports = mongoose.model('Task', TaskSchema);