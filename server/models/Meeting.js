const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Meeting = new Schema(
    {
        organizer_id: { 
            type: Schema.Types.ObjectId, 
            required: true,
            ref: 'user'  // Référence au modèle User
        },
        title: { 
            type: String, 
            required: true 
        },
        description: { 
            type: String 
        },
        start_time: { 
            type: Date, 
            required: true 
        },
        end_time: { 
            type: Date, 
            required: true 
        },
        participants: [{ 
            type: Schema.Types.ObjectId,
            ref: 'user'  // Référence au modèle User
        }],
        meeting_link: {
            type: String,
            required: true
        },
        created_at: { 
            type: Date, 
            default: Date.now 
        }
    }
);

module.exports = mongoose.model('Meeting', Meeting);