import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import Report from '../models/Report.js';
import { authenticate } from '../middleware/auth.js';
import { suspendCheck } from '../middleware/suspendCheck.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.post('/:reportId', authenticate, suspendCheck, upload.array('files', 5), async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (report.reportedBy.toString() !== req.user._id.toString() && !['countyadmin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const files = req.files.map(f => {
      const buffer = fs.readFileSync(f.path);
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
      return { filename: f.originalname, url: `/uploads/evidence/${f.filename}`, sha256 };
    });

    report.evidenceFiles.push(...files);
    await report.save();
    res.json({ files });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
