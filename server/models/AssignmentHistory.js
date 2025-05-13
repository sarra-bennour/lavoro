const mongoose = require('mongoose');

const AssignmentHistorySchema = new mongoose.Schema({
  task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  member_id: { type: mongoose.Schema.Types.ObjectId, ref: 'teamMember', required: true },
  assigned_at: { type: Date, default: Date.now },
  success: { type: Boolean, default: null }, // null = en cours, true/false = résultat
  skill_match: { type: Number, required: true },
  feedback_score: { type: Number, min: 1, max: 5 }
});

module.exports = mongoose.model('AssignmentHistory', AssignmentHistorySchema);