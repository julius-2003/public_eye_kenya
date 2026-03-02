import mongoose from 'mongoose';

const taskForceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  county: { type: String, required: true },
  relatedReport: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
}, { timestamps: true });

export default mongoose.model('TaskForce', taskForceSchema);
