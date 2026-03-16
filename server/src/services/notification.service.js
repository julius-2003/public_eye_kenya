import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Create notification for super admin
export const notifyAdmins = async (type, title, message, metadata = {}, county = null, priority = 'normal') => {
  try {
    // Notify super admins
    const superAdmins = await User.find({ role: 'superadmin' });
    for (const admin of superAdmins) {
      await Notification.create({
        recipientId: admin._id,
        recipientRole: 'superadmin',
        type,
        title,
        message,
        metadata,
        priority,
        actionUrl: metadata.actionUrl || null,
      });
    }

    // If county is specified, notify county admin too
    if (county) {
      const countyAdmin = await User.findOne({ role: 'countyadmin', assignedCounty: county });
      if (countyAdmin) {
        await Notification.create({
          recipientId: countyAdmin._id,
          recipientRole: 'countyadmin',
          county,
          type,
          title,
          message,
          metadata,
          priority,
          actionUrl: metadata.actionUrl || null,
        });
      }
    }
  } catch (err) {
    console.error('Error creating notifications:', err.message);
  }
};

// Get unread notification count
export const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ recipientId: userId, isRead: false });
};

// Mark as read
export const markAsRead = async (notificationId) => {
  return await Notification.findByIdAndUpdate(
    notificationId,
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

// Mark all as read
export const markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    { recipientId: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};
