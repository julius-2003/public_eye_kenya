import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  county: { type: String, required: true },
  room: { type: String, required: true }, // general, water, roads, health, education, housing, finance
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  alias: { type: String, required: true },
  message: { type: String, required: true, maxlength: 500 },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('ChatMessage', chatMessageSchema);
