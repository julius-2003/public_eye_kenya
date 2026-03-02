import User from '../models/User.js';
import Report from '../models/Report.js';
import SupportPayment from '../models/SupportPayment.js';
import ChatMessage from '../models/ChatMessage.js';
import { signToken } from '../utils/jwt.js';
import { runAIPatternDetector } from '../services/aiDetector.js';

export const getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'countyadmin') filter.county = req.user.assignedCounty;
    if (req.query.county) filter.county = req.query.county;
    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter)
      .select('-password -nationalIdHash -faceDescriptor -emailVerifyToken')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const changeRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, assignedCounty } = req.body;

    if (!['citizen', 'countyadmin', 'superadmin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = role;
    if (role === 'countyadmin') user.assignedCounty = assignedCounty;
    else user.assignedCounty = null;

    await user.save();
    const newToken = signToken(user);

    res.json({ message: 'Role updated', user: user.toSafeObject(), newToken });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const toggleSuspend = async (req, res) => {
  try {
    const { id } = req.params;
    const { suspend, reason } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'citizen') return res.status(400).json({ message: 'Can only suspend citizens' });

    user.isSuspended = suspend;
    if (suspend) {
      user.suspendedBy = req.user._id;
      user.suspendedAt = new Date();
      user.suspendReason = reason;
    } else {
      user.suspendedBy = undefined;
      user.suspendedAt = undefined;
      user.suspendReason = undefined;
    }
    await user.save();

    res.json({ message: suspend ? 'User suspended' : 'User unsuspended', user: user.toSafeObject() });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getAdminReports = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'countyadmin') filter.county = req.user.assignedCounty;
    if (req.query.county && req.user.role === 'superadmin') filter.county = req.query.county;
    if (req.query.aiFlag) filter.aiFlag = true;

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ reports });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getAIFlags = async (req, res) => {
  try {
    const filter = { aiFlag: true };
    if (req.user.role === 'countyadmin') filter.county = req.user.assignedCounty;

    const reports = await Report.find(filter).sort({ aiRiskScore: -1 });
    res.json({ reports });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const triggerAI = async (req, res) => {
  try {
    await runAIPatternDetector();
    res.json({ message: 'AI pattern detector triggered successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getPayments = async (req, res) => {
  try {
    const payments = await SupportPayment.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'anonymousAlias county');
    res.json({ payments });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await ChatMessage.findById(id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (req.user.role === 'countyadmin' && msg.county !== req.user.assignedCounty) {
      return res.status(403).json({ message: 'County mismatch' });
    }
    await msg.updateOne({ isDeleted: true, deletedBy: req.user._id, deletedAt: new Date(), message: '[deleted]' });
    res.json({ message: 'Message deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getOverview = async (req, res) => {
  try {
    const filter = req.user.role === 'countyadmin' ? { county: req.user.assignedCounty } : {};
    const userFilter = req.user.role === 'countyadmin' ? { county: req.user.assignedCounty } : {};

    const [totalUsers, totalReports, suspendedUsers, pendingReports, aiFlagged, payments] = await Promise.all([
      User.countDocuments(userFilter),
      Report.countDocuments(filter),
      User.countDocuments({ ...userFilter, isSuspended: true }),
      Report.countDocuments({ ...filter, status: 'pending' }),
      Report.countDocuments({ ...filter, aiFlag: true }),
      SupportPayment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);

    const verifiedToday = await User.countDocuments({ ...userFilter, emailVerified: true, updatedAt: { $gte: new Date(Date.now() - 86400000) } });

    res.json({ totalUsers, totalReports, suspendedUsers, pendingReports, aiFlagged, verifiedToday, totalDonations: payments[0]?.total || 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
