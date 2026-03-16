import { Router } from 'express';
import { getReports, createReport, voteReport, updateReportStatus, deleteReport } from '../controllers/reports.controller.js';
import { authenticate } from '../middleware/auth.js';
import { emailVerify } from '../middleware/emailVerify.js';
import { suspendCheck } from '../middleware/suspendCheck.js';
import { requireAdmin } from '../middleware/roleGuard.js';
import { upload, chatUpload } from '../middleware/upload.js';
import ReportMessage from '../models/ReportMessage.js';
import { notifyAdmins } from '../services/notification.service.js';

const router = Router();
router.use(authenticate);
router.get('/', getReports);
router.post('/', emailVerify, suspendCheck, upload.array('evidence', 5), createReport);
router.post('/:id/vote', emailVerify, suspendCheck, voteReport);
router.put('/:id/status', requireAdmin, updateReportStatus);
router.delete('/:id', requireAdmin, deleteReport);

// Report Messages (Comments)
router.get('/:reportId/messages', async (req, res) => {
  try {
    const { reportId } = req.params;
    const messages = await ReportMessage.find({ reportId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:reportId/messages', emailVerify, suspendCheck, chatUpload.single('file'), async (req, res) => {
  try {
    const { reportId } = req.params;
    const { message } = req.body;
    const trimmedMessage = (message || '').trim();
    
    if (!trimmedMessage && !req.file) {
      return res.status(400).json({ message: 'Message or attachment required' });
    }

    // Check if report exists
    const Report = await import('../models/Report.js').then(m => m.default);
    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    // Build attachment if file uploaded
    let attachments = [];
    if (req.file) {
      attachments.push({
        url: `/api/uploads/chat/${req.file.filename}`,
        fileType: req.file.mimetype.startsWith('image/') ? 'image' : req.file.mimetype.startsWith('video/') ? 'video' : 'document',
        fileName: req.file.originalname
      });
    }

    const reportMsg = await ReportMessage.create({
      reportId,
      sender: req.user._id,
      senderAlias: req.user.anonymousAlias,
      senderRole: req.user.role,
      message: trimmedMessage || '',
      attachments
    });

    // Notify admins
    await notifyAdmins(
      'report_message',
      'New comment on report',
      `${req.user.anonymousAlias} added a comment to report: "${report.title}"`,
      { reportId, userId: req.user._id, actionUrl: `/report/${reportId}` },
      report.county,
      'normal'
    );

    res.json({ message: reportMsg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete report message (admins only)
router.delete('/:reportId/messages/:messageId', requireAdmin, async (req, res) => {
  try {
    const { messageId } = req.params;
    await ReportMessage.findByIdAndUpdate(
      messageId,
      { isDeleted: true, deletedBy: req.user._id, deletedAt: new Date() },
      { new: true }
    );
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
