import { Router } from 'express';
import { sendGenericEmail } from '../services/emailService.js';

const router = Router();

// Email verification redirect handled in auth routes
router.get('/verify/:token', (req, res) => res.redirect(`${process.env.CLIENT_URL}/verify-email?token=${req.params.token}`));

/* Test endpoint for Resend email configuration */
router.post('/test', async (req, res) => {
  const { to, subject, html } = req.body;

  // Validate inputs
  if (!to || !subject || !html) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: to, subject, html'
    });
  }

  const result = await sendGenericEmail(to, subject, html);
  
  if (result.success) {
    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      id: result.id
    });
  } else {
    return res.status(500).json({
      success: false,
      error: result.error
    });
  }
});

export default router;
