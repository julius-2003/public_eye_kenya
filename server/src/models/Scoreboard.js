import mongoose from 'mongoose';

const scoreboardSchema = new mongoose.Schema({
  county: { type: String, required: true },
  department: { type: String, required: true },
  transparencyScore: { type: Number, default: 0 },
  responseRate: { type: Number, default: 0 },
  avgResolutionDays: { type: Number, default: 0 },
  corruptionRisk: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  corruptionRiskScore: { type: Number, default: 0 },
  corruptionRiskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  totalReports: { type: Number, default: 0 },
  resolvedReports: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Scoreboard', scoreboardSchema);
