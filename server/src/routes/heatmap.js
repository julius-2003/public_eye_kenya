import { Router } from 'express';
import Report from '../models/Report.js';

const router = Router();
router.get('/', async (_req, res) => {
  try {
    const data = await Report.aggregate([
      { $group: { 
          _id: '$county', 
          count: { $sum: 1 }, 
          critical: { $sum: { $cond: [{ $eq: ['$severity','critical'] },1,0] } }, 
          high: { $sum: { $cond: [{ $eq: ['$severity','high'] },1,0] } }, 
          aiFlags: { $sum: { $cond: ['$aiFlag',1,0] } } 
      } },
      { $sort: { count: -1 } }
    ]);
    
    const heatmap = data.map(d => {
      let baseScore = d.count * 5 + d.aiFlags * 15;
      if (d.critical > 0) baseScore += 75;
      else if (d.high > 0) baseScore += 45;

      return {
        county: d._id,
        reportCount: d.count,
        criticalCount: d.critical,
        aiFlags: d.aiFlags,
        riskScore: Math.min(100, baseScore)
      };
    });

    res.json({ heatmap });
  } catch (err) { res.status(500).json({ message: err.message }); }
});
export default router;
