const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const Incident = require('../models/Incident');
const { INCIDENT_TYPES } = require('../models/Incident');

const router = express.Router();

// Rate limit: 1 report per user per 10 minutes (per IP as proxy)
const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1,
  message: { success: false, message: 'Too many reports. Please wait 10 minutes before reporting again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/incidents?lat=30.73&lng=76.78&radius=1000
// Returns incidents near a location (for map display)
router.get('/', protect, async (req, res) => {
  try {
    const { lat, lng, radius = 2000 } = req.query;

    let query = { isActive: true };

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      };
    }

    const incidents = await Incident.find(query)
      .populate('reportedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, count: incidents.length, incidents });
  } catch (err) {
    console.error('Get incidents error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch incidents.' });
  }
});

// POST /api/incidents — Report new incident
router.post('/', protect, reportLimiter, async (req, res) => {
  try {
    const { type, description, severity = 'medium', lat, lng, title } = req.body;

    if (!type || !INCIDENT_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid type. Must be one of: ${INCIDENT_TYPES.join(', ')}`,
      });
    }

    //if (!lat || !lng || isNaN(lat) || isNaN(lng))
    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: 'Valid lat and lng are required.' });
    }

    // Auto-generate a title if not provided by the UI form
    let finalTitle = title;
    if (!finalTitle) {
      const typeLabels = {
        poor_lighting: 'Poor Lighting',
        theft: 'Theft / Snatching',
        harassment: 'Harassment Report',
        isolated_area: 'Isolated Stretch',
        suspicious_activity: 'Suspicious Activity',
        road_hazard: 'Road Hazard',
      };
      finalTitle = `${typeLabels[type] || 'Safety Incident'} (${severity.charAt(0).toUpperCase() + severity.slice(1)})`;
    }

    const incident = await Incident.create({
      title: finalTitle,
      type,
      severity,
      description: description?.trim(),
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      reportedBy: req.user._id,
      confidenceScore: 0.6, // Start community reports at 0.6 confidence
      confidence: 0.6,
      source: 'SafeRoute Community Report',
    });

    res.status(201).json({ success: true, incident });
  } catch (err) {
    console.error('Create incident error:', err);
    res.status(500).json({ success: false, message: 'Failed to create incident.' });
  }
});

// POST /api/incidents/:id/confirm — Confirm an existing incident (boosts confidence)
router.post('/:id/confirm', protect, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found.' });

    if (incident.reportedBy.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot confirm your own report.' });
    }

    if (incident.confirmedBy && incident.confirmedBy.some(id => id.toString() === req.user._id.toString())) {
      return res.status(400).json({ success: false, message: 'You have already confirmed this report.' });
    }

    incident.confirmations += 1;
    if (!incident.confirmedBy) {
      incident.confirmedBy = [];
    }
    incident.confirmedBy.push(req.user._id);

    const newConf = Math.min(1.0, 0.5 + incident.confirmations * 0.1);
    incident.confidence = newConf;
    incident.confidenceScore = newConf;
    await incident.save();

    res.json({ success: true, incident });
  } catch (err) {
    console.error('Confirm incident error:', err);
    res.status(500).json({ success: false, message: 'Failed to confirm incident.' });
  }
});

// DELETE /api/incidents/:id — Only reporter can delete their own report
router.delete('/:id', protect, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found.' });

    if (incident.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this report.' });
    }

    incident.isActive = false;
    await incident.save();

    res.json({ success: true, message: 'Incident removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove incident.' });
  }
});

// GET /api/incidents/types — Return valid incident types for UI
router.get('/types', (req, res) => {
  const typeLabels = {
    poor_lighting: 'Poor Lighting',
    theft: 'Theft / Robbery',
    harassment: 'Harassment',
    isolated_area: 'Isolated Area',
    suspicious_activity: 'Suspicious Activity',
    road_hazard: 'Road Hazard',
  };
  res.json({ success: true, types: INCIDENT_TYPES.map(t => ({ value: t, label: typeLabels[t] || t })) });
});

module.exports = router;
