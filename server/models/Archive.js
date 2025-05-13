const mongo = require('mongoose');
const Schema = mongo.Schema;

const Archive = new Schema(
  {
   name: { type: String, required: true , index: true },// index pour optimiser les recherches,
      description: { type: String },
      budget: { type: Number, default: 0 },
      manager_id: { type: mongo.Schema.Types.ObjectId, ref: 'user' }, // Reference to User model
      ProjectManager_id: { type: mongo.Schema.Types.ObjectId, ref: 'user' }, // Reference to User model
      team_id: { type: mongo.Schema.Types.ObjectId },
      client: { type: String },
      start_date: { type: Date },
      end_date: { type: Date },
      status: { 
          type: String, 
          enum: ['Not Started', 'In Progress', 'Completed', 'Archived'], 
          default: 'Not Started' 
      },
       originalStatus: String, // Store the original status here

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
      tasks: [{type : mongo.Schema.Types.ObjectId, ref: 'Task', required:false }]

  }
);

module.exports = mongo.model('Archive', Archive);