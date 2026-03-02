import { Router } from 'express';
const router = Router();
// Email verification redirect handled in auth routes
router.get('/verify/:token', (req, res) => res.redirect(`${process.env.CLIENT_URL}/verify-email?token=${req.params.token}`));
export default router;
