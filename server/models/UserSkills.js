const mongo = require('mongoose');
const Schema = mongo.Schema;
const UserSkills = new Schema({
    
    user_id: { type: mongo.Schema.Types.ObjectId, required: true, ref: 'user' },
    skill_id: [{ type: mongo.Schema.Types.ObjectId, required: true, ref: 'skills' }],
    updated_at: { type: Date, default: Date.now }

});
module.exports = mongo.model('userskills', UserSkills);
