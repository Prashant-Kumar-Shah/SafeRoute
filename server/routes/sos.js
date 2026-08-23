const express = require('express');
const { protect } = require('../middleware/auth');
const SosAlert = require('../models/SosAlert');
const EmergencyContact = require('../models/EmergencyContact');

const router = express.Router();

// POST /api/sos — Trigger SOS alert
// Logs the alert to MongoDB. UI displays the full message.
// This is "integration-ready" — swapping in a real SMS provider is a single service call.
router.post('/', protect, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    //if (!lat || !lng || isNaN(lat) || isNaN(lng)) 
    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)){
      return res.status(400).json({ success: false, message: 'Valid lat and lng are required.' });
    }

    // Fetch the user's emergency contacts
    const contacts = await EmergencyContact.find({ user: req.user._id });

    const timestamp = new Date();
    const osmLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=17`;
    const googleMapsLink = `https://maps.google.com/?q=${lat},${lng}`;

    const message = `🚨 EMERGENCY ALERT
From: ${req.user.name}
Time: ${timestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}
Map: ${googleMapsLink}
OSM: ${osmLink}

This person has triggered an SOS alert on SafeRoute.
Please contact them immediately or call emergency services (100/112).`;

    // Log alert to MongoDB
    const alert = await SosAlert.create({
      triggeredBy: req.user._id,
      userName: req.user.name,
      userPhone: req.user.phone || 'Not provided',
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      osmLink,
      contactsNotified: contacts.map(c => ({
        name: c.name,
        phone: c.phone,
        relationship: c.relationship,
      })),
      message,
    });

    console.log(`🚨 SOS ALERT logged — User: ${req.user.name} | Location: ${lat},${lng} | Contacts: ${contacts.length}`);

    // Twilio SMS Integration
    let smsDispatchedCount = 0;
    const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);

    if (twilioConfigured) {
      console.log(`📲 Twilio is configured. Attempting to send SMS to ${contacts.length} contact(s)...`);
      const axios = require('axios');
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const fromNum = process.env.TWILIO_PHONE_NUMBER;
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');

      for (const contact of contacts) {
        if (!contact.phone) continue;
        try {
          const shortMessage = `🚨 SOS: ${req.user.name}\nLoc: ${lat.toFixed(4)}, ${lng.toFixed(4)}\nMap: https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

          const params = new URLSearchParams();
          params.append('To', contact.phone);
          params.append('From', fromNum);
          params.append('Body', shortMessage);

          await axios.post(
            `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
            params.toString(),
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${auth}`,
              },
            }
          );
          console.log(`✅ SOS SMS sent successfully to ${contact.name} (${contact.phone})`);
          smsDispatchedCount++;
        } catch (smsErr) {
          console.error(`❌ Failed to send SOS SMS to ${contact.name} (${contact.phone}):`, smsErr.response?.data || smsErr.message);
        }
      }
    } else {
      console.log(`ℹ️ Twilio is NOT configured. Skipping SMS dispatch (Simulation mode).`);
    }

    res.status(201).json({
      success: true,
      alertId: alert._id,
      message,
      location: { lat: parseFloat(lat), lng: parseFloat(lng), osmLink, googleMapsLink },
      contactsNotified: contacts.map(c => ({ name: c.name, phone: c.phone, relationship: c.relationship })),
      timestamp,
      note: contacts.length === 0
        ? 'No emergency contacts saved. Add contacts in the Contacts section.'
        : twilioConfigured
          ? `Alert logged. SMS successfully dispatched to ${smsDispatchedCount} contact(s).`
          : `Alert logged for ${contacts.length} contact(s). In production, SMS would be dispatched here.`,
    });
  } catch (err) {
    console.error('SOS error:', err);
    res.status(500).json({ success: false, message: 'Failed to trigger SOS alert.' });
  }
});

// GET /api/sos/history — User's own SOS history
router.get('/history', protect, async (req, res) => {
  try {
    const alerts = await SosAlert.find({ triggeredBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch SOS history.' });
  }
});

module.exports = router;
