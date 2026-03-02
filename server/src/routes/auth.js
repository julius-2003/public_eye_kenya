import { Router } from 'express';
import { register, login, getMe, verifyEmail } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/verify-email/:token', verifyEmail);
export default router;
