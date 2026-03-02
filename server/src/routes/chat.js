import { Router } from 'express';
import ChatMessage from '../models/ChatMessage.js';
import { authenticate } from '../middleware/auth.js';
import { emailVerify } from '../middleware/emailVerify.js';

const router = Router();
router.use(authenticate, emailVerify);

router.get('/:county/:room', async (req, res) => {
  try {
    const { county, room } = req.params;
    if (req.user.role !== 'superadmin' && req.user.county !== county) {
      return res.status(403).json({ message: 'County mismatch' });
    }
    const messages = await ChatMessage.find({ county, room, isDeleted: false })
      .sort({ createdAt: -1 }).limit(50);
    res.json({ messages: messages.reverse() });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
