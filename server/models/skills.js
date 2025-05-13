const mongo = require('mongoose');
const Schema = mongo.Schema;
const Skills = new Schema({
        name: { type: String, required: true },
        description: { type: String },
        created_at: { type: Date, default: Date.now }
      }
);
module.exports = mongo.model('skills', Skills);
