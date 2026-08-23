const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  routeId: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  encounteredIssues: [
    {
      type: String,
    },
  ],
  comments: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
