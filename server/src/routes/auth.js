import { Router } from 'express';
import { register, login, getMe, verifyEmail, forgotPassword, resetPassword, getProfile, updateProfile, storeFacePhoto } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/face/store', authenticate, storeFacePhoto);
export default router;
