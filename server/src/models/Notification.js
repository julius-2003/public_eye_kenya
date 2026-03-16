import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Recipient
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientRole: { type: String, enum: ['superadmin', 'countyadmin', 'citizen'], required: true },
  county: { type: String }, // For county admin scope
  
  // Notification Type
  type: { 
    type: String, 
    enum: [
      'new_report',           // New report submitted
      'report_message',       // Comment on a report
      'urgent_flag',          // Urgent votes on report
      'chat_flagged',         // Chat message flagged by AI
      'new_chat',             // New critical chat message
      'admin_action',         // Admin action (suspension, etc.)
    ], 
    required: true 
  },
  
  // Reference
  refType: { type: String, enum: ['Report', 'ChatMessage', 'User'], },
  refId: { type: mongoose.Schema.Types.ObjectId },
  
  // Content
  title: { type: String, required: true },
  message: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed }, // Additional data like severity, user who triggered, etc.
  
  // Read status
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  
  // Priority
  priority: { type: String, enum: ['normal', 'high', 'critical'], default: 'normal' },
  actionUrl: { type: String }, // URL to navigate to when clicked
  
}, { timestamps: true });

// Auto-expire notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('Notification', notificationSchema);
