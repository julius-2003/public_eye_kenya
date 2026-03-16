import { Router } from 'express';
import Announcement from '../models/Announcement.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleGuard.js';
import { chatUpload } from '../middleware/upload.js';

const router = Router();

// Get announcements for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const { county } = req.user;
    const role = req.user.role;

    let query = { isActive: true };

    // Super admin sees all announcements (global + all counties)
    if (role === 'superadmin') {
      query = { isActive: true };
    }
    // County admin sees global + their assigned county announcements
    else if (role === 'countyadmin') {
      query = { 
        isActive: true, 
        $or: [
          { county: req.user.assignedCounty },
          { isGlobal: true }
        ] 
      };
    }
    // Citizens see their county announcements + global announcements
    else {
      query = { 
        isActive: true,
        $or: [
          { county: county },
          { isGlobal: true }
        ]
      };
    }

    const announcements = await Announcement.find(query)
      .populate('postedBy', 'firstName lastName anonymousAlias')
      .sort({ priority: -1, publishedAt: -1 })
      .limit(100);

    res.json({ announcements });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create announcement (admins only)
router.post('/', authenticate, requireAdmin, chatUpload.array('attachments', 5), async (req, res) => {
  try {
    const { title, message, priority, county, isGlobal } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    // Only super admin can make global announcements
    if (isGlobal && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only super admins can make global announcements' });
    }

    // County admin can only post to their county
    if (req.user.role === 'countyadmin' && county !== req.user.assignedCounty) {
      return res.status(403).json({ message: 'You can only post to your assigned county' });
    }

    // Build attachments array
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        url: `/api/uploads/chat/${file.filename}`,
        fileName: file.originalname,
        fileType: file.mimetype.startsWith('image/') ? 'image' 
                 : file.mimetype.startsWith('video/') ? 'video' 
                 : 'document'
      }));
    }

    const announcement = await Announcement.create({
      postedBy: req.user._id,
      postedByRole: req.user.role,
      title,
      message,
      priority: priority || 'normal',
      county: isGlobal ? null : (county || req.user.assignedCounty),
      isGlobal: isGlobal === true || isGlobal === 'true',
      attachments
    });

    await announcement.populate('postedBy', 'firstName lastName anonymousAlias');

    res.status(201).json({ 
      message: 'Announcement posted successfully',
      announcement 
    });
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update announcement (admins only, own announcements)
router.put('/:id', authenticate, requireAdmin, chatUpload.array('attachments', 5), async (req, res) => {
  try {
    const { title, message, priority, isActive } = req.body;
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Only the poster can edit
    if (announcement.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own announcements' });
    }

    if (title) announcement.title = title;
    if (message) announcement.message = message;
    if (priority) announcement.priority = priority;
    if (isActive !== undefined) announcement.isActive = isActive;

    // Add new attachments if provided
    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(file => ({
        url: `/api/uploads/chat/${file.filename}`,
        fileName: file.originalname,
        fileType: file.mimetype.startsWith('image/') ? 'image' 
                 : file.mimetype.startsWith('video/') ? 'video' 
                 : 'document'
      }));
      announcement.attachments = [...(announcement.attachments || []), ...newAttachments];
    }

    await announcement.save();
    await announcement.populate('postedBy', 'firstName lastName anonymousAlias');

    res.json({ announcement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete announcement (admins only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Only the poster or super admin can delete
    if (announcement.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'You cannot delete this announcement' });
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
