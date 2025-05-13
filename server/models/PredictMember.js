
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PredictMember = new Schema({
    team_id: { type: mongoose.Schema.Types.ObjectId, required: false , ref: 'team'},
    user_id: { type: mongoose.Schema.Types.ObjectId, required: false ,ref: 'user'},
    project_id: {  type: mongoose.Schema.Types.ObjectId, required: false , ref: 'Project'},
    role: {
        type: Schema.Types.Mixed, // Accepte n'importe quel type de données
        ref: 'role',
        required: false },
            experience_level: { type: Number, min: 1, max: 3, default: 1 }, // 1=Junior, 2=Mid, 3=Senior
    total_tasks_completed: { type: Number, default: 0 },
    productivity: { type: Number, default: 0 },
    performance_score: { type: Number, min: 0, max: 100, default: 0 },
    rank: { type: Number },          // New field
    predicted_at: { type: Date } ,// New field
    user_name: { type: String },      // New field
    user_image: { type: String },     // New field
    team_name: { type: String },
    project_name: { type: String },

}, { timestamps: true });



module.exports = mongoose.model('predictMember', PredictMember);