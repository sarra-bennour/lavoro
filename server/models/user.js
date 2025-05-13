const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

  firstName: { type: String, required: true },

  lastName: { type: String},

  email: { type: String, required: true, unique: true },

  password_hash: { type: String,  },
 
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'role', default: null },

  image: { type: String },

  phone_number: { type: Number },

  created_at: { type: Date, default: Date.now },

  updated_at: { type: Date, default: Date.now },

  last_activity: { type: Date, default: Date.now },
  
  is_active: { type: Boolean, default: true },

  verificationToken: {type : String},

  isVerified: { type: Boolean, default: false },

  resetPasswordToken: { type: String },  
  resetPasswordExpires: { type: Date },  

  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },

  provider: {
    type: String,
   
    enum: ["Google","Microsoft", "GitHub"], 
  },
  provider_id: {
    type: String,
   
  },
  twoFactorSecret: { type: String }, 
  twoFactorEnabled: { type: Boolean, default: false }, 
  performancePoints: { type: Number, default: 0 }, 
  skills: { type: [String], default: [] },
  
  description: { type: String, default: '' },

  awards: [{
    type: {
      type: String,
      enum: ['performance', 'achievement', 'recognition'],
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: String,
    date: {
      type: Date,
      default: Date.now
    },
    icon: String
  }]



});

const User = mongoose.model('user', userSchema);

module.exports = User;