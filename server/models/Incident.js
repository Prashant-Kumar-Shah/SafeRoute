const mongoose = require('mongoose');

const INCIDENT_TYPES = ['poor_lighting', 'theft', 'harassment', 'isolated_area', 'suspicious_activity', 'road_hazard'];

const incidentSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Incident title is required'], trim: true, maxlength: 100 },
  type: { type: String, enum: INCIDENT_TYPES, required: [true, 'Incident type is required'] },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium', required: [true, 'Incident severity is required'] },
  description: { type: String, maxlength: [500, 'Description too long'], trim: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required'],
      validate: {
        validator: (coords) => coords.length === 2 && coords[0] >= -180 && coords[0] <= 180 && coords[1] >= -90 && coords[1] <= 90,
        message: 'Invalid coordinates',
      },
    },
  },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: String, default: 'SafeRoute Community Report' },
  confidenceScore: { type: Number, default: 0.5, min: 0, max: 1 },
  // Sync with confidenceScore for scoring engine backward compatibility
  confidence: { type: Number, default: 0.5, min: 0, max: 1 },
  affectsGroups: { type: [String], default: [] },
  reportedAt: { type: Date, default: Date.now },
  confirmations: { type: Number, default: 0 },
  confirmedBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  // Auto-expiry: weight decays after 30 days
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    index: { expireAfterSeconds: 0 }, // MongoDB TTL index
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Pre-save hook to ensure legacy confidence is always in sync with confidenceScore
incidentSchema.pre('save', function () {
  if (this.isModified('confidenceScore')) this.confidence = this.confidenceScore;
  else if (this.isModified('confidence')) this.confidenceScore = this.confidence;
  else if (this.confidenceScore !== undefined) this.confidence = this.confidenceScore;
});

// Geospatial index for proximity queries
incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Incident', incidentSchema);
module.exports.INCIDENT_TYPES = INCIDENT_TYPES;