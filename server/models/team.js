const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Team = new Schema({
    name: { type: String, required: true },
    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    //members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true }],
    capacity: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    status: { type: String, enum: ['Active', 'Archived'], default: 'Active' },
    description: { type: String, default: '' },
    tags: [{ type: String, default: '' }],
    color: { type: String, default: '#3755e6' }
});

module.exports = mongoose.model('team', Team);