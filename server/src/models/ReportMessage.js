import mongoose from 'mongoose';

const reportMessageSchema = new mongoose.Schema({
  reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderAlias: { type: String, required: true },
  senderRole: { type: String, enum: ['citizen', 'countyadmin', 'superadmin'], required: true },
  
  // Message content
  message: { type: String, required: true, maxlength: 1000 },
  
  // Attachments (same as chat)
  attachments: [{
    url: String, // URL of file
    fileType: String, // 'image', 'video', 'document'
    fileName: String
  }],
  
  // Moderation
  isDeleted: { type: Boolean, default: false },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date },
  
  // AI check
  flaggedByAI: { type: Boolean, default: false },
  flagReason: { type: String },
  
}, { timestamps: true });

export default mongoose.model('ReportMessage', reportMessageSchema);
