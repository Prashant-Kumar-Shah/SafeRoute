const mongoose = require('mongoose');

const sosAlertSchema = new mongoose.Schema({
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: String,
  userPhone: String,
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  osmLink: String, // openstreetmap.org link with coordinates
  contactsNotified: [
    {
      name: String,
      phone: String,
      relationship: String,
    },
  ],
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['sent', 'acknowledged', 'resolved'],
    default: 'sent',
  },
}, { timestamps: true });

module.exports = mongoose.model('SosAlert', sosAlertSchema);
