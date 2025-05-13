const mongo = require('mongoose');
const Schema = mongo.Schema;

const TeamMember = new Schema({

    team_id: { type: mongo.Schema.Types.ObjectId, required: true, ref: 'team' },
    user_id: { type: mongo.Schema.Types.ObjectId, required: true, ref: 'user' },
    role: {
        type: Schema.Types.Mixed, // Accepte n'importe quel type de données
        ref: 'role',
        required: false },
    skills: [{ type: mongo.Schema.Types.ObjectId, ref: 'skills' }],
    completed_tasks_count: { type: Number, default: 0 },
    joined_at: { type: Date, default: Date.now },

    tasks: [{
        type: mongo.Schema.Types.ObjectId,
        ref: 'Task',
        required: false
    }],

    // Performance metrics
    experience_level: { type: Number, min: 1, max: 3, default: 1 }, // 1=Junior, 2=Mid, 3=Senior
    total_tasks_completed: { type: Number, default: 0 },
    missed_deadlines: { type: Number, default: 0 },
    average_task_duration: { type: Number, default: 0 },
    task_quality_score: { type: Number, default: 0 },
    deadline_adherence: { type: Number, default: 0 },
    task_efficiency: { type: Number, default: 0 },
    completion_rate: { type: Number, default: 0 },
    productivity: { type: Number, default: 0 },
    performance_score: { type: Number, min: 0, max: 100, default: 0 }
}, { timestamps: true });




module.exports = mongo.model('teamMember', TeamMember);