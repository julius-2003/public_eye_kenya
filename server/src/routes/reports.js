import { Router } from 'express';
import { getReports, createReport, voteReport, updateReportStatus, deleteReport } from '../controllers/reports.controller.js';
import { authenticate } from '../middleware/auth.js';
import { emailVerify } from '../middleware/emailVerify.js';
import { suspendCheck } from '../middleware/suspendCheck.js';
import { requireAdmin } from '../middleware/roleGuard.js';
import { upload } from '../middleware/upload.js';

const router = Router();
router.use(authenticate);
router.get('/', getReports);
router.post('/', emailVerify, suspendCheck, upload.array('evidence', 5), createReport);
router.post('/:id/vote', emailVerify, suspendCheck, voteReport);
router.put('/:id/status', requireAdmin, updateReportStatus);
router.delete('/:id', requireAdmin, deleteReport);
export default router;
