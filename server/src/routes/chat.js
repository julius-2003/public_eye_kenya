import { Router } from 'express';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { emailVerify } from '../middleware/emailVerify.js';
import { chatUpload } from '../middleware/upload.js';

const router = Router();

// Get all chats - Super admin sees all, County admin sees only their county, Citizens see their county
router.get('/:county/:room', authenticate, async (req, res) => {
  try {
    const { county, room } = req.params;
    
    // Check if user is blocked (they won't be able to view any chats)
    const superAdmin = await User.findOne({ role: 'superadmin' });
    if (superAdmin && superAdmin.blockedUsers.includes(req.user._id)) {
      return res.status(403).json({ message: 'You have been blocked from viewing chats by an administrator' });
    }

    // Super admin can access any county
    if (req.user.role === 'superadmin') {
      const messages = await ChatMessage.find({ county, room, isDeleted: false })
        .sort({ createdAt: -1 }).limit(50)
        .populate('sender', 'anonymousAlias');
      return res.json({ messages: messages.reverse() });
    }

    // County admin can only access their assigned county
    if (req.user.role === 'countyadmin') {
      if (county !== req.user.assignedCounty) {
        return res.status(403).json({ message: 'You can only access chats from your assigned county' });
      }
      const messages = await ChatMessage.find({ county, room, isDeleted: false })
        .sort({ createdAt: -1 }).limit(50)
        .populate('sender', 'anonymousAlias');
      return res.json({ messages: messages.reverse() });
    }

    // Citizens can only access their county
    if (county !== req.user.county) {
      return res.status(403).json({ message: 'County mismatch' });
    }

    const messages = await ChatMessage.find({ county, room, isDeleted: false })
      .sort({ createdAt: -1 }).limit(50)
      .populate('sender', 'anonymousAlias');
    res.json({ messages: messages.reverse() });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Upload chat attachment
router.post('/upload', authenticate, chatUpload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });
    
    const fileUrl = `/api/uploads/chat/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
