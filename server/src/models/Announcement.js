import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  // Author
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postedByRole: { type: String, enum: ['superadmin', 'countyadmin'], required: true },
  
  // Scope
  county: { type: String }, // For county admin announcements (null = global for super admin)
  isGlobal: { type: Boolean, default: false }, // Super admin can make global announcements
  
  // Content
  title: { type: String, required: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 2000 },
  
  // Attachments
  attachments: [{
    url: String,
    fileName: String,
    fileType: String, // 'image', 'video', 'document'
  }],
  
  // Priority
  priority: { type: String, enum: ['normal', 'high', 'urgent'], default: 'normal' },
  
  // Status
  isActive: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }, // Optional expiry date
  
}, { timestamps: true });

// Index for queries
announcementSchema.index({ county: 1, isActive: 1, publishedAt: -1 });
announcementSchema.index({ isGlobal: 1, isActive: 1, publishedAt: -1 });

export default mongoose.model('Announcement', announcementSchema);
