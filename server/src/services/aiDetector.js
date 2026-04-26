import Report from '../models/Report.js';

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

    console.log(`✅ AI Detector: flagged ${contractorPatterns.length} contractor patterns`);
  } catch (err) {
    console.error('AI Detector error:', err.message);
  }
};

