const mongo = require('mongoose');
const Schema = mongo.Schema;

const Role = new Schema({
  RoleID: {
    

    type: mongo.Schema.Types.UUID,
    default: () => new mongo.Types.UUID(),
    unique: true,
    required: true,
  },
  RoleName: {
    type: String,
    required: true,
    unique: true,
  },
  hierarchyLevel: { type: Number, required: true },
  Description: {
    type: String,
  },
  Permissions: {
    type: [String], // Tableau de permissions
    default: [],
  },
});

module.exports = mongo.model('role', Role);