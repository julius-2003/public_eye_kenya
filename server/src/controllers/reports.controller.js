import crypto from 'crypto';
import fs from 'fs';
import Report from '../models/Report.js';

export const getReports = async (req, res) => {
  try {
    const { county, status, severity, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Citizens can only see their county
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

    // Notify county room via socket
    req.io.to(`county:${county}`).emit('new_report', {
      _id: report._id, title, county, severity, category, createdAt: report.createdAt
    });

    res.status(201).json({ report });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const voteReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // confirm | urgent | fake
    if (!['confirm', 'urgent', 'fake'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ message: 'Report not found' });

    const userId = req.user._id;
    // Remove from all vote arrays first
    for (const vt of ['confirm', 'urgent', 'fake']) {
      report.votes[vt] = report.votes[vt].filter(v => v.toString() !== userId.toString());
    }
    report.votes[voteType].push(userId);

    // Score: confirm=1, urgent=2, fake=-1
    const weights = { confirm: 1, urgent: 2, fake: -1 };
    report.voteScore = report.votes.confirm.length + report.votes.urgent.length * 2 - report.votes.fake.length;

    // Auto-escalate severity on high votes
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
