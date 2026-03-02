import { Router } from 'express';
import Report from '../models/Report.js';

const router = Router();
router.get('/', async (_req, res) => {
  try {
    const data = await Report.aggregate([
      { $group: { _id: '$county', count: { $sum: 1 }, critical: { $sum: { $cond: [{ $eq: ['$severity','critical'] },1,0] } }, aiFlags: { $sum: { $cond: ['$aiFlag',1,0] } } } },
      { $sort: { count: -1 } }
    ]);
    const heatmap = data.map(d => ({
      county: d._id, reportCount: d.count, criticalCount: d.critical, aiFlags: d.aiFlags,
      riskScore: Math.min(100, d.critical * 10 + d.count * 2 + d.aiFlags * 5)
    }));
    res.json({ heatmap });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
export default router;
