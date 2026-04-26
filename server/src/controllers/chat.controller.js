import ChatMessage from '../models/ChatMessage.js';

// GET /api/chat/:county/:roomType
export const getMessages = async (req, res) => {
  try {
    const { county, roomType } = req.params;
    // Citizens can only read their county's chat
    if (req.user.role === 'citizen' && county !== req.user.county) {
      return res.status(403).json({ message: 'Access denied to other county chats' });
    }
    const messages = await ChatMessage.find({ county, roomType, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get messages', error: err.message });
  }
};

// DELETE /api/admin/chat/:id — admin moderation
export const deleteMessage = async (req, res) => {
  try {
    const msg = await ChatMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (req.user.role === 'countyadmin' && msg.county !== req.user.assignedCounty) {
      return res.status(403).json({ message: 'County access denied' });
    }
    msg.isDeleted = true;
    msg.deletedBy = req.user._id;
    msg.deletedAt = new Date();
    msg.content = '[Message removed by moderator]';
    await msg.save();
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed', error: err.message });
  }
};
