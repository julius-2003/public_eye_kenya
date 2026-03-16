import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import Report from '../models/Report.js';
import { authenticate } from '../middleware/auth.js';
import { suspendCheck } from '../middleware/suspendCheck.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Upload evidence file for a new report (before report is created)
router.post('/upload', authenticate, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file provided' });
    
    const buffer = fs.readFileSync(req.file.path);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    
    res.json({
      filename: req.file.originalname,
      url: `/api/uploads/evidence/${req.file.filename}`,
      sha256
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
      return { filename: f.originalname, url: `/api/uploads/evidence/${f.filename}`, sha256 };
    });

    report.evidenceFiles.push(...files);
    await report.save();
    res.json({ files });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
