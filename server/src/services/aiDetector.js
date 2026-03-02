import Report from '../models/Report.js';
import Scoreboard from '../models/Scoreboard.js';

export const runAIPatternDetector = async () => {
  try {
    console.log('🤖 Running AI Pattern Detector...');

    // Find contractor patterns: same contractorId in 3+ reports
    const contractorPipeline = [
      { $unwind: '$contractorIds' },
      { $group: { _id: { contractor: '$contractorIds', county: '$county' }, count: { $sum: 1 }, reportIds: { $push: '$_id' } } },
      { $match: { count: { $gte: 3 } } }
    ];
    const contractorPatterns = await Report.aggregate(contractorPipeline);

    for (const pattern of contractorPatterns) {
      await Report.updateMany(
        { _id: { $in: pattern.reportIds } },
        {
          aiFlag: true,
          aiPattern: `Contractor ${pattern._id.contractor} appears in ${pattern.count} reports`,
          aiRiskScore: Math.min(100, pattern.count * 15)
        }
      );
    }

    // Update county risk scores in scoreboard
    const countyCounts = await Report.aggregate([
      { $group: { _id: '$county', total: { $sum: 1 }, critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } } } }
    ]);

    for (const c of countyCounts) {
      const risk = c.critical > 10 ? 'critical' : c.critical > 5 ? 'high' : c.total > 20 ? 'medium' : 'low';
      await Scoreboard.updateMany({ county: c._id }, { corruptionRisk: risk }, { upsert: false });
    }

    console.log(`✅ AI Detector: flagged ${contractorPatterns.length} contractor patterns`);
  } catch (err) {
    console.error('AI Detector error:', err.message);
  }
};
