import { Router } from 'express';
import { initiatePayment, getStatus, mpesaCallback } from '../controllers/support.controller.js';
import { authenticate } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
router.post('/initiate', optionalAuth, initiatePayment);
router.get('/status/:id', getStatus);
router.post('/callback', mpesaCallback); // public webhook
export default router;
