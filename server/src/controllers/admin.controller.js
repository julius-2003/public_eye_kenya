import User from '../models/User.js';
import Report from '../models/Report.js';
import SupportPayment from '../models/SupportPayment.js';
import ChatMessage from '../models/ChatMessage.js';
import { signToken } from '../utils/jwt.js';
import { runAIPatternDetector } from '../services/aiDetector.js';
import { sendCountyAdminApprovedEmail } from '../services/emailService.js';
import { calculateFaceSimilarity, hasStoredFace } from '../services/faceVerification.js';

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

export const verifyUserEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.emailVerified) {
      return res.json({ message: 'User already verified', user: user.toSafeObject() });
    }

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    res.json({ message: 'User email verified by admin', user: user.toSafeObject() });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Super admin updates user's darajani (tier) and till number
export const updateUserDarajani = async (req, res) => {
  try {
    const { id } = req.params;
    const { darajani, tillNumber } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (darajani) user.darajani = darajani;
    if (tillNumber !== undefined) user.tillNumber = tillNumber;
    
    await user.save();

    res.json({ message: 'User darajani and till updated', user: user.toSafeObject() });
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

    const [totalUsers, totalReports, suspendedUsers, pendingReports, aiFlagged] = await Promise.all([
      User.countDocuments(userFilter),
      Report.countDocuments(filter),
      User.countDocuments({ ...userFilter, isSuspended: true }),
      Report.countDocuments({ ...filter, status: 'pending' }),
      Report.countDocuments({ ...filter, aiFlag: true }),
    ]);

    const verifiedToday = await User.countDocuments({ 
      ...userFilter, 
      emailVerified: true, 
      updatedAt: { $gte: new Date(Date.now() - 86400000) } 
    });

    // Get donations
    let paymentFilter = { status: 'success' };
    
    if (req.user.role === 'countyadmin') {
      // County admin sees donations from their county only
      const countyUsers = await User.find({ county: req.user.assignedCounty }).select('_id');
      const countyUserIds = countyUsers.map(u => u._id);
      paymentFilter.userId = { $in: countyUserIds };
    }

    const payments = await SupportPayment.aggregate([
      { $match: paymentFilter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // For super admin, also get pending county admin verifications
    const pendingCountyAdmins = req.user.role === 'superadmin' 
      ? await User.countDocuments({ role: 'countyadmin', isVerifiedCountyAdmin: false })
      : 0;

    const response = {
      totalUsers, 
      totalReports, 
      suspendedUsers, 
      pendingReports, 
      aiFlagged, 
      verifiedToday, 
      totalDonations: payments[0]?.total || 0
    };

    // Add pending county admin count for super admin only
    if (req.user.role === 'superadmin') {
      response.pendingCountyAdminVerifications = pendingCountyAdmins;
    }

    res.json(response);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Super admin verifies a county admin
export const verifyCountyAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'countyadmin') {
      return res.status(400).json({ message: 'User is not a county admin' });
    }

    // If already verified, just return success
    if (user.isVerifiedCountyAdmin) {
      return res.json({
        message: 'County admin is already verified',
        user: user.toSafeObject(),
        alreadyVerified: true
      });
    }

    // Check if user has face enrolled
    const hasFace = hasStoredFace(user);
    let faceVerificationResult = null;

    if (hasFace) {
      try {
        faceVerificationResult = {
          hasFace: true,
          requiresManualReview: true
        };
      } catch (faceErr) {
        console.warn('Face verification check failed:', faceErr.message);
      }
    }

    // Verify the county admin using findByIdAndUpdate for guaranteed persistence
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        isVerifiedCountyAdmin: true,
        emailVerified: true,
        verifiedByAdmin: req.user._id,
        verifiedAt: new Date()
      },
      { new: true }
    );

    // Send approval email to county admin
    try {
      await sendCountyAdminApprovedEmail(
        updatedUser.email,
        `${updatedUser.firstName} ${updatedUser.lastName}`,
        updatedUser.assignedCounty
      );
    } catch (emailErr) {
      console.warn(`⚠️ Failed to send approval email to ${updatedUser.email}:`, emailErr.message);
    }

    // Emit socket event to notify user of role change in real-time
    try {
      req.io.to(`user:${id}`).emit('role_updated', {
        role: updatedUser.role,
        isVerifiedCountyAdmin: updatedUser.isVerifiedCountyAdmin,
        assignedCounty: updatedUser.assignedCounty,
        message: 'Your role has been updated by the administrator'
      });
    } catch (socketErr) {
      console.warn('Failed to emit role update event:', socketErr.message);
    }

    res.json({
      message: 'County admin verified successfully! ✓ They can now log in.',
      user: updatedUser.toSafeObject(),
      verificationStatus: {
        isVerified: true,
        canLogin: true,
        verifiedAt: updatedUser.verifiedAt
      },
      faceVerificationResult
    });
  } catch (err) {
    console.error('County admin verification error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get pending county admin verifications (for super admin only)
export const getPendingCountyAdmins = async (req, res) => {
  try {
    const users = await User.find({ role: 'countyadmin', isVerifiedCountyAdmin: false })
      .select('-password -nationalIdHash -emailVerifyToken')
      .sort({ createdAt: -1 });

    // Add face verification status to each user
    const usersWithFaceStatus = users.map(user => {
      const userObj = user.toObject();
      userObj.hasFace = hasStoredFace(user);
      return userObj;
    });

    res.json({ users: usersWithFaceStatus });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Super admin blocks a user from chats (prevent them from viewing/posting in any chat)
export const blockUserFromChat = async (req, res) => {
  try {
    const { id, blockUserId } = req.params;
    const admin = await User.findById(id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const userToBlock = await User.findById(blockUserId);
    if (!userToBlock) return res.status(404).json({ message: 'User to block not found' });

    // Add to blocked list if not already there
    if (!admin.blockedUsers.includes(blockUserId)) {
      admin.blockedUsers.push(blockUserId);
      await admin.save();
    }

    res.json({ message: `User ${userToBlock.anonymousAlias} blocked from chats`, user: admin.toSafeObject() });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Super admin unblocks a user from chats
export const unblockUserFromChat = async (req, res) => {
  try {
    const { id, blockUserId } = req.params;
    const admin = await User.findById(id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    admin.blockedUsers = admin.blockedUsers.filter(uid => uid.toString() !== blockUserId);
    await admin.save();

    res.json({ message: 'User unblocked from chats', user: admin.toSafeObject() });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Get all donations with optional county filter
export const getAllDonations = async (req, res) => {
  try {
    let filter = { status: 'success' };
    
    if (req.user.role === 'countyadmin') {
      // County admin sees donations for users in their county only
      const countyUsers = await User.find({ county: req.user.assignedCounty }).select('_id');
      const countyUserIds = countyUsers.map(u => u._id);
      filter.userId = { $in: countyUserIds };
    }

    const payments = await SupportPayment.find(filter)
      .sort({ createdAt: -1 })
      .populate('userId', 'anonymousAlias county');
    
    const total = await SupportPayment.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({ payments, totalDonated: total[0]?.total || 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Super admin: Get all user profiles with detailed information
export const getAllProfiles = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -nationalIdHash -faceDescriptor -emailVerifyToken -passwordResetToken')
      .sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Get a specific user's profile for admin review (includes face verification data)
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select('-password -nationalIdHash -emailVerifyToken -passwordResetToken');

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check county access for county admins
    if (req.user.role === 'countyadmin' && user.county !== req.user.assignedCounty) {
      return res.status(403).json({ message: 'Cannot view profiles outside your county' });
    }

    // Add face verification status
    const userObj = user.toObject();
    userObj.hasFace = hasStoredFace(user);

    res.json({ user: userObj });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Super admin can manually verify a user's face similarity
// This endpoint can be used for future automatic verification
export const verifyFaceSimilarity = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!hasStoredFace(user)) {
      return res.status(400).json({
        message: 'User does not have face enrollment',
        hasFace: hasStoredFace(user)
      });
    }

    // For now, return the verification data
    // In production, you might want to:
    // 1. Download both images
    // 2. Extract face descriptors using server-side face-api
    // 3. Calculate similarity
    // 4. Auto-approve if similarity > 85%

    res.json({
      userId: user._id,
      name: `${user.firstName} ${user.lastName}`,
      hasFace: true,
      message: 'User face enrollment available.'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const deleteUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    // Check county access for county admins
    if (req.user.role === 'countyadmin' && user.county !== req.user.assignedCounty) {
      return res.status(403).json({ message: 'Cannot delete profiles outside your county' });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'User profile deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Get support payment settings (Super admin and County admin only)
export const getSupportSettings = async (req, res) => {
  try {
    const admin = req.user;
    if (admin.role !== 'superadmin' && admin.role !== 'countyadmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const settings = {
      supportPaymentName: admin.supportPaymentName || 'Support PublicEye',
      supportPaymentEnabled: admin.supportPaymentEnabled !== false,
      tillNumber: admin.tillNumber || '',
      pochiCompanyName: admin.pochiCompanyName || 'PublicEye Kenya',
      pochiPhoneNumber: admin.pochiPhoneNumber || '',
      darajani: admin.darajani || 'standard'
    };

    res.json({ settings });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Update support payment settings (Super admin and County admin only)
export const updateSupportSettings = async (req, res) => {
  try {
    const { supportPaymentName, supportPaymentEnabled, tillNumber, pochiCompanyName, pochiPhoneNumber } = req.body;
    const admin = req.user;

    if (admin.role !== 'superadmin' && admin.role !== 'countyadmin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update the admin's settings
    if (supportPaymentName) admin.supportPaymentName = supportPaymentName;
    if (supportPaymentEnabled !== undefined) admin.supportPaymentEnabled = supportPaymentEnabled;
    if (tillNumber !== undefined) admin.tillNumber = tillNumber;
    if (pochiCompanyName) admin.pochiCompanyName = pochiCompanyName;
    if (pochiPhoneNumber !== undefined) admin.pochiPhoneNumber = pochiPhoneNumber;

    await admin.save();

    res.json({ 
      message: 'Support settings updated successfully', 
      settings: {
        supportPaymentName: admin.supportPaymentName,
        supportPaymentEnabled: admin.supportPaymentEnabled,
        tillNumber: admin.tillNumber,
        pochiCompanyName: admin.pochiCompanyName,
        pochiPhoneNumber: admin.pochiPhoneNumber
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Get support donations summary (Super admin sees all, County admin sees their county only)
export const getSupportSummary = async (req, res) => {
  try {
    let filter = { status: 'success' };
    
    if (req.user.role === 'countyadmin') {
      // County admin sees donations for users in their county only
      const countyUsers = await User.find({ county: req.user.assignedCounty }).select('_id');
      const countyUserIds = countyUsers.map(u => u._id);
      filter.userId = { $in: countyUserIds };
    }

    const total = await SupportPayment.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const recentPayments = await SupportPayment.find(filter)
      .sort({ completedAt: -1 })
      .limit(10)
      .populate('userId', 'anonymousAlias county');

    res.json({ 
      totalDonations: total[0]?.total || 0,
      donationCount: total[0]?.count || 0,
      recentPayments
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
