
const mongoose = require('mongoose');

const EmailSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  subject: { type: String, required: true },
  text: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false }, // New field to indicate if the email is archived
  isStarred: { type: Boolean, default: false }, // New field to indicate if the email is starred
  createdAt: { type: Date, default: Date.now },
  relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  direction: { 
    type: String, 
    required: true,
    enum: ['sent', 'received'],
    default: 'received' 
  },
  senderUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user',  // Make sure this matches your User model name exactly
    required: function() { return this.direction === 'sent'; }
  },
  receiverUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user',  // Make sure this matches your User model name exactly
    required: function() { return this.direction === 'received'; } 
  }
});

module.exports = mongoose.model('Email', EmailSchema);