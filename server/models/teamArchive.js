const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeamArchive = new Schema({
  name: { type: String, required: true, index: true },
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  // members field removed - now using TeamMember collection
  capacity: { type: Number, default: 0 },
  description: { type: String, default: '' },
  tags: [{ type: String, default: '' }],
  color: { type: String, default: '#4b4b4b' },
  originalColor: { type: String }, // Stores the original color before archiving
  status: { type: String, enum: ['Active', 'Archived'], default: 'Archived' },
  originalStatus: String, // Stores the original status before archiving
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TeamArchive', TeamArchive);