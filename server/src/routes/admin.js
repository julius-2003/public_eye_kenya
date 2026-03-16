import { Router } from 'express';
import {  getUsers, changeRole, toggleSuspend, verifyUserEmail, getAdminReports,  getAIFlags, triggerAI, getPayments, deleteChat, getOverview,
  verifyCountyAdmin, getPendingCountyAdmins, blockUserFromChat,  unblockUserFromChat, getAllDonations, updateUserDarajani, getAllProfiles,
  getSupportSettings, updateSupportSettings, getSupportSummary,
  getUserProfile, deleteUserProfile, verifyFaceSimilarity
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/roleGuard.js';

const router = Router();
router.use(authenticate, requireAdmin);

// User management
router.get('/users', getUsers);
router.get('/profiles', requireSuperAdmin, getAllProfiles); // Super admin only
router.get('/users/:id/profile', getUserProfile); // View user profile (image, face verification)
router.delete('/users/:id/profile', deleteUserProfile); // Delete user profile
router.put('/users/:id/role', requireSuperAdmin, changeRole);
router.put('/users/:id/darajani', requireSuperAdmin, updateUserDarajani); // Update tier and till
router.put('/users/:id/suspend', toggleSuspend);
router.put('/users/:id/verify-email', requireSuperAdmin, verifyUserEmail);

// County admin verification (Super admin only)
router.get('/county-admins/pending', requireSuperAdmin, getPendingCountyAdmins);
router.put('/county-admins/:id/verify', requireSuperAdmin, verifyCountyAdmin);
router.get('/users/:userId/face-similarity', requireSuperAdmin, verifyFaceSimilarity); // Check face similarity

// Chat blocking (Super admin only)
router.post('/users/:id/block-chat/:blockUserId', requireSuperAdmin, blockUserFromChat);
router.delete('/users/:id/unblock-chat/:blockUserId', requireSuperAdmin, unblockUserFromChat);

// Reports and flags
router.get('/reports', getAdminReports);
router.get('/ai/flags', getAIFlags);
router.post('/ai/trigger', requireSuperAdmin, triggerAI);

// Donations/Payments
router.get('/donations', getAllDonations);
router.get('/payments', requireSuperAdmin, getPayments);

// Support Payment Settings (Super admin and County admin only)
router.get('/support/settings', getSupportSettings);
router.put('/support/settings', updateSupportSettings);
router.get('/support/summary', getSupportSummary);

// Chat moderation
router.delete('/chat/:id', deleteChat);

// Overview dashboard
router.get('/overview', getOverview);

export default router;
