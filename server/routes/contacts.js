const express = require('express');
const { protect } = require('../middleware/auth');
const EmergencyContact = require('../models/EmergencyContact');

const router = express.Router();

const MAX_CONTACTS = 5;

// GET /api/contacts
router.get('/', protect, async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ user: req.user._id }).sort({ createdAt: 1 });
    res.json({ success: true, contacts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch contacts.' });
  }
});

// POST /api/contacts
router.post('/', protect, async (req, res) => {
  try {
    const count = await EmergencyContact.countForUser(req.user._id);
    if (count >= MAX_CONTACTS) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_CONTACTS} emergency contacts allowed.`,
      });
    }

    const { name, phone, relationship } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required.' });
    }

    const contact = await EmergencyContact.create({
      user: req.user._id,
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship?.trim() || 'Contact',
    });

    res.status(201).json({ success: true, contact });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: Object.values(err.errors)[0].message });
    }
    res.status(500).json({ success: false, message: 'Failed to add contact.' });
  }
});

// DELETE /api/contacts/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const contact = await EmergencyContact.findOne({ _id: req.params.id, user: req.user._id });
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found.' });
    }
    await contact.deleteOne();
    res.json({ success: true, message: 'Contact removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove contact.' });
  }
});

// PUT /api/contacts/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;
    const contact = await EmergencyContact.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name: name?.trim(), phone: phone?.trim(), relationship: relationship?.trim() },
      { new: true, runValidators: true }
    );
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found.' });
    res.json({ success: true, contact });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update contact.' });
  }
});

module.exports = router;
