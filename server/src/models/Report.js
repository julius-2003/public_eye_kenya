import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Ghost Workers', 'Contractor Kickbacks', 'Missing Funds', 'Bribery', 'Nepotism', 'Procurement Fraud', 'Other'],
    required: true
  },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  county: { type: String, required: true },
  subcounty: { type: String },
  department: { type: String },
  contractorIds: [String],
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  anonymousAlias: { type: String }, // snapshot at time of report
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'dismissed', 'whistleblown'],
    default: 'pending'
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  reviewNote: { type: String },
  // Voting
  votes: {
    confirm: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    urgent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    fake: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  voteScore: { type: Number, default: 0 },
  // Evidence
  evidenceFiles: [{
    filename: String,
    url: String,
    sha256: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  // AI
  aiFlag: { type: Boolean, default: false },
  aiPattern: { type: String },
  aiRiskScore: { type: Number, default: 0 },
  // Whistleblower
  whistleblownAt: { type: Date },
  whistleblownTo: [String],
  // Timer
  timerDeadline: { type: Date },
}, { timestamps: true });

// Auto-set 14-day timer on create
reportSchema.pre('save', function (next) {
  if (this.isNew && !this.timerDeadline) {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14);
    this.timerDeadline = deadline;
  }
  next();
});

export default mongoose.model('Report', reportSchema);
