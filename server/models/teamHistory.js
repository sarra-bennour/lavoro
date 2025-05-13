const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeamHistory = new Schema(
  {
    team_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'team',  // Add reference to team model
      required: true 
    },
    changed_by: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'user',  // Add reference to user model
      required: true 
    },
    change_type: {
      type: String,
      enum: [
        'Team Created',
        'Team Updated',
        'Status Update',
        'Member Added',
        'Member Removed',
        'Manager Changed',
        'Tags Updated',
        'Description Updated',
        'Capacity Updated',
        'Color Updated',
        'Team Archived',
        'Team Unarchived',
        'Other Update'
      ],
      required: true,
    },
    old_value: { 
      type: Schema.Types.Mixed,  // Changed to Mixed to handle different data types
      required: false  // Not required for creation events
    },
    new_value: { 
      type: Schema.Types.Mixed,  // Changed to Mixed to handle different data types
      required: false  // Not required for deletion events
    },
    additional_info: {  // For storing extra context about the change
      type: Schema.Types.Mixed,
      default: null
    },
    changed_at: { 
      type: Date, 
      default: Date.now 
    },
    system_generated: {  // Flag for system-generated changes vs user actions
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: false,  // Using custom changed_at instead
    versionKey: false   // Disable the __v field
  }
);

// Add indexes for better query performance
TeamHistory.index({ team_id: 1 });
TeamHistory.index({ changed_at: -1 });
TeamHistory.index({ change_type: 1 });

module.exports = mongoose.model('TeamHistory', TeamHistory);