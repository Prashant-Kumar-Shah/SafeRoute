const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Contact name is required'],
    trim: true,
    maxlength: [60, 'Name too long'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\+?[\d\s\-()]{7,15}$/, 'Please enter a valid phone number'],
  },
  relationship: {
    type: String,
    trim: true,
    maxlength: [30, 'Relationship description too long'],
    default: 'Contact',
  },
}, { timestamps: true });

// Max 5 emergency contacts per user
emergencyContactSchema.statics.countForUser = async function (userId) {
  return this.countDocuments({ user: userId });
};

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
