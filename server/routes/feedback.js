const express = require('express');
const { protect } = require('../middleware/auth');
const Feedback = require('../models/Feedback');

const router = express.Router();

// POST /api/feedback
router.post('/', protect, async (req, res) => {
  try {
    const { routeId, rating, encounteredIssues, comments } = req.body;
    if (!routeId || !rating) {
      return res.status(400).json({ success: false, message: 'Route ID and rating are required.' });
    }

    const feedback = await Feedback.create({
      user: req.user._id,
      routeId,
      rating,
      encounteredIssues: encounteredIssues || [],
      comments: comments || '',
    });

    res.status(201).json({ success: true, feedback });
  } catch (err) {
    console.error('Feedback submit error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit feedback.' });
  }
});

module.exports = router;
