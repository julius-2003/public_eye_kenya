const mongoose = require('mongoose');

const aiFlagSchema = new mongoose.Schema({
  pattern: { type: String, required: true },
  description: String,
  county: String,
  department: String,
  relatedReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Report' }],
  contractorId: String,
  confidence: { type: Number, min: 0, max: 1 },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['new', 'reviewed', 'whistleblown', 'dismissed'],
    default: 'new',
  },
  triggeredBy: {
    type: String,
    enum: ['cron', 'manual'],
    default: 'cron',
  },
  triggeredByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('AIFlag', aiFlagSchema);
