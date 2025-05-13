const mongo = require('mongoose');
const Schema = mongo.Schema;

const ProjectHistory = new Schema(
  {
    project_id: { type: mongo.Schema.Types.ObjectId, required: true }, // Use ObjectId here
    changed_by: { type: mongo.Schema.Types.ObjectId }, // Use ObjectId for user ID as well
    change_type: {
      type: String,
        enum: [
          'Project Created',
          'Status Update',
          'Deadline Change',
          'Start Date Change',
          'Description Update',
          'Budget Update',
          'Manager Changed',
          'Team Changed',
          'Client Updated',
          'Risk Level Updated',
          'Tags Updated',
          'Project Name Updated',
          'Other Update' // Fallback for dynamic fields
        ],
        required: true,
      }
    ,
    progress: { type: Number, default: 0 },
    old_value: { type: String, required: true },
    new_value: { type: String, required: true },
    changed_at: { type: Date, default: Date.now },
  }
);

module.exports = mongo.model('ProjectHistory', ProjectHistory);