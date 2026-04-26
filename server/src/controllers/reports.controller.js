import Report from '../models/Report.js';
import User from '../models/User.js';
import { notifyAdmins } from '../services/notification.service.js';
import { sendNewReportEmail } from '../services/emailService.js';

export const getReports = async (req, res) => {
  try {
    const { county, status, severity, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (req.user.role === 'citizen') filter.county = req.user.county;
    else if (req.user.role === 'countyadmin') filter.county = req.user.assignedCounty;
    else if (county) filter.county = county;
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('-reportedBy');
    const total = await Report.countDocuments(filter);
    res.json({ reports, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createReport = async (req, res) => {
  try {
    const { title, description, category, severity, county, subcounty, department, contractorIds, evidenceFiles } = req.body;
    if (req.user.county !== county && req.user.role === 'citizen') {
      return res.status(403).json({ message: 'You can only report in your county' });
    }
    const report = await Report.create({
      title, description, category, severity, county, subcounty, department,
      contractorIds: contractorIds ? JSON.parse(contractorIds) : [],
      reportedBy: req.user._id,
      anonymousAlias: req.user.anonymousAlias,
      evidenceFiles: evidenceFiles || []
    });
    await req.user.updateOne({ $inc: { totalReports: 1 } });

    // Socket: notify county room
    req.io.to(`county:${county}`).emit('new_report', {
      _id: report._id, title, county, severity, category, createdAt: report.createdAt
    });

    // Respond immediately — email/notification run async so they don't block
    res.status(201).json({ report });

    // ── async: in-app notifications + emails ──────────────────────────────
    setImmediate(async () => {
      try {
        const priority = severity === 'critical' ? 'critical' : severity === 'high' ? 'high' : 'normal';

        // In-app notification for admins
        await notifyAdmins(
          'new_report',
          `New ${severity} report in ${county}`,
          `"${title}" — Category: ${category}`,
          { actionUrl: '/admin/reports', county, severity, category },
          county,
          priority,
        );

        // Email: county admin + superadmins
        const [countyAdmin, superAdmins] = await Promise.all([
          User.findOne({ role: 'countyadmin', assignedCounty: county, isVerifiedCountyAdmin: true }).select('email firstName'),
          User.find({ role: 'superadmin' }).select('email firstName'),
        ]);
        const adminEmails = [
          ...(countyAdmin ? [countyAdmin.email] : []),
          ...superAdmins.map(a => a.email),
        ].filter(Boolean);

        if (adminEmails.length) {
          await sendNewReportEmail(adminEmails, { reportTitle: title, county, severity, category });
        }

        // Email: county citizens (only for high/critical to avoid spam)
        if (['high', 'critical'].includes(severity)) {
          const citizens = await User.find({ role: 'citizen', county }).select('email').limit(500);
          const citizenEmails = citizens.map(c => c.email).filter(Boolean);
          if (citizenEmails.length) {
            await sendNewReportEmail(citizenEmails, { reportTitle: title, county, severity, category });
          }
        }
      } catch (e) {
        console.error('[createReport] Post-response processing error:', e.message);
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const voteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    if (!['confirm', 'urgent', 'fake'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    const userId = req.user._id;
    for (const vt of ['confirm', 'urgent', 'fake']) {
      report.votes[vt] = report.votes[vt].filter(v => v.toString() !== userId.toString());
    }
    report.votes[voteType].push(userId);
    report.voteScore = report.votes.confirm.length + report.votes.urgent.length * 2 - report.votes.fake.length;
    if (report.votes.urgent.length >= 10) report.severity = 'critical';
    else if (report.votes.urgent.length >= 5) report.severity = 'high';
    await report.save();
    await req.user.updateOne({ $inc: { totalVotes: 1 } });
    res.json({ voteScore: report.voteScore, votes: { confirm: report.votes.confirm.length, urgent: report.votes.urgent.length, fake: report.votes.fake.length } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;
    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (req.user.role === 'countyadmin' && report.county !== req.user.assignedCounty) {
      return res.status(403).json({ message: 'County mismatch' });
    }
    report.status = status;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    if (reviewNote) report.reviewNote = reviewNote;
    if (status === 'whistleblown') report.whistleblownAt = new Date();
    await report.save();
    req.io.to(`county:${report.county}`).emit('report_updated', {
      _id: report._id, status, county: report.county
    });
    res.json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    if (req.user.role === 'countyadmin' && report.county !== req.user.assignedCounty) {
      return res.status(403).json({ message: 'County mismatch' });
    }
    await report.deleteOne();
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
