import { Router } from 'express';
import TaskForce from '../models/TaskForce.js';
import { authenticate } from '../middleware/auth.js';
import { emailVerify } from '../middleware/emailVerify.js';
import { suspendCheck } from '../middleware/suspendCheck.js';

const router = Router();
router.use(authenticate, emailVerify);

router.get('/', async (req, res) => {
  try {
    const filter = { county: req.user.county };
    const forces = await TaskForce.find(filter).populate('createdBy', 'anonymousAlias').populate('members', 'anonymousAlias');
    res.json({ forces });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', suspendCheck, async (req, res) => {
  try {
    const { name, description, relatedReport } = req.body;
    const force = await TaskForce.create({ name, description, county: req.user.county, relatedReport, createdBy: req.user._id, members: [req.user._id] });
    await req.user.updateOne({ $inc: { taskForceCount: 1 } });
    res.status(201).json({ force });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/join', suspendCheck, async (req, res) => {
  try {
    const force = await TaskForce.findById(req.params.id);
    if (!force) return res.status(404).json({ message: 'Task force not found' });
    if (!force.members.includes(req.user._id)) {
      force.members.push(req.user._id);
      await force.save();
      await req.user.updateOne({ $inc: { taskForceCount: 1 } });
    }
    res.json({ force });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
