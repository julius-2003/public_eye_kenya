import { Router } from 'express';
import Scoreboard from '../models/Scoreboard.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.get('/', async (req, res) => {
  try {
    const { county } = req.query;
    const filter = county ? { county } : {};
    const boards = await Scoreboard.find(filter).sort({ transparencyScore: -1 });
    res.json({ boards });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
export default router;
