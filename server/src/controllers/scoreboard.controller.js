const Scoreboard = require('../models/Scoreboard');
const Report = require('../models/Report');

// GET /api/scoreboard
exports.getScoreboard = async (req, res) => {
  try {
    const { county } = req.query;
    const filter = county ? { county } : {};
    const scores = await Scoreboard.find(filter).sort({ corruptionRiskScore: -1 });
    res.json({ scoreboard: scores });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get scoreboard', error: err.message });
  }
};

// POST /api/scoreboard/refresh — rebuild from reports data
exports.refreshScoreboard = async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: { county: '$county', department: '$department' },
          totalReports: { $sum: 1 },
          resolvedReports: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          avgScore: { $avg: '$voteScore' },
          criticalCount: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        },
      },
    ];
    const data = await Report.aggregate(pipeline);
    for (const item of data) {
      const responseRate = item.totalReports > 0 ? (item.resolvedReports / item.totalReports) * 100 : 0;
      const riskScore = Math.min(100, item.criticalCount * 15 + (100 - responseRate));
      const riskLevel = riskScore >= 75 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';
      await Scoreboard.findOneAndUpdate(
        { county: item._id.county, department: item._id.department },
        {
          transparencyScore: Math.max(0, 100 - riskScore),
          responseRate,
          totalReports: item.totalReports,
          resolvedReports: item.resolvedReports,
          corruptionRiskScore: riskScore,
          corruptionRiskLevel: riskLevel,
          lastUpdated: new Date(),
        },
        { upsert: true }
      );
    }
    res.json({ message: 'Scoreboard refreshed' });
  } catch (err) {
    res.status(500).json({ message: 'Refresh failed', error: err.message });
  }
};
