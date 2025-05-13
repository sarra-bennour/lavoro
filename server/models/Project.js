const mongo = require('mongoose');
const Schema = mongo.Schema;

const Project = new Schema({
    name: { type: String, required: true , index: true },// index pour optimiser les recherches,
    description: { type: String },
    budget: { type: Number, default: 0 },
    manager_id: { type: mongo.Schema.Types.ObjectId, ref: 'user' }, // Reference to User model
    ProjectManager_id: { type: mongo.Schema.Types.ObjectId, ref: 'user' }, // Reference to User model
    team_id: { type: mongo.Schema.Types.ObjectId },
    client: { type: String },
    start_date: { type: Date },
    end_date: { type: Date },
    total_tasks_count: { type: Number, default: 0 },
    estimated_duration: { type: Number, default: 0 },
    team_member_count: { type: Number, default: 0 },
    priority: { type: String },
    status: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Completed', 'Archived'],
        default: 'Not Started'
    },
    risk_level: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium',
    },
    risks: { type: String, default: 'None' },
    tags: { type: String },
    ai_predicted_completion: { type: Date },
    ai_predicted_description: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    tasks: [{type : mongo.Schema.Types.ObjectId, ref: 'Task', required:false }], 

});
Project.index({ name: 'text' });
module.exports = mongo.model('Project', Project);

