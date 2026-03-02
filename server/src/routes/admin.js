import { Router } from 'express';
import { getUsers, changeRole, toggleSuspend, getAdminReports, getAIFlags, triggerAI, getPayments, deleteChat, getOverview } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/roleGuard.js';

const router = Router();
router.use(authenticate, requireAdmin);
router.get('/users', getUsers);
router.put('/users/:id/role', requireSuperAdmin, changeRole);
router.put('/users/:id/suspend', toggleSuspend);
router.get('/reports', getAdminReports);
router.get('/ai/flags', getAIFlags);
router.post('/ai/trigger', requireSuperAdmin, triggerAI);
router.get('/payments', requireSuperAdmin, getPayments);
router.delete('/chat/:id', deleteChat);
router.get('/overview', getOverview);
export default router;
