import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail, sendCountyAdminApprovalEmail, sendWelcomeCitizenEmail, sendWelcomeCountyAdminEmail } from '../services/emailService.js';
import { storeFaceDescriptor, hasStoredFace } from '../services/faceVerification.js';

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, nationalId, county, role } = req.body;

    // Validate all required fields
    if (!email || !password || !firstName || !lastName || !phone || !nationalId || !county) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Force role to citizen - no county admin registration allowed
    const finalRole = 'citizen';

    // Check for duplicates - email, phone, nationalId
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      if (existing.email === email.toLowerCase()) {
        return res.status(409).json({ message: 'Email already registered' });
      }
      if (existing.phone === phone) {
        return res.status(409).json({ message: 'Phone number already registered' });
      }
    }
    
    // Check for duplicate national ID by comparing with all existing hashes
    const allUsers = await User.find({});
    for (const existingUser of allUsers) {
      const isMatch = await bcrypt.compare(nationalId, existingUser.nationalIdHash);
      if (isMatch) {
        return res.status(409).json({ message: 'National ID already registered' });
      }
    }

    const nationalIdHash = await bcrypt.hash(nationalId, 12);
    // Auto-verify user, skip email verification
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      nationalIdHash,
      county,
      role: finalRole,
      assignedCounty: null,
      emailVerified: true,
    });
    
    // Send welcome email asynchronously without blocking the response
    sendWelcomeCitizenEmail(email, firstName).catch(emailErr => {
      console.warn('Email sending failed (non-critical):', emailErr.message);
    });
    
    res.status(201).json({
      message: 'Registration successful. You are auto-verified. Please complete face enrollment.',
      userId: user._id,
      role: finalRole
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const lowerEmail = email ? email.toLowerCase() : '';
    const user = await User.findOne({ email: lowerEmail });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.isSuspended) return res.status(403).json({ message: 'Account suspended', suspended: true });

    // County admins must be verified by super admin before getting access
    if (user.role === 'countyadmin' && !user.isVerifiedCountyAdmin) {
      return res.status(403).json({ 
        message: 'Your account is pending verification by a super admin. You will receive access once verified.',
        pendingVerification: true 
      });
    }

    // Email verification check disabled

    const token = signToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMe = async (req, res) => {
  res.json({ user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({
      emailVerifyToken: token,
      emailVerifyExpires: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired verification link' });

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    const jwt_token = signToken(user);
    res.json({ message: 'Email verified!', token: jwt_token, user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    try {
      await sendPasswordResetEmail(email, resetUrl, rawToken);
    } catch (emailErr) {
      console.warn('Password reset email failed (non-critical):', emailErr.message);
    }

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      email: email ? email.toLowerCase() : '',
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can now sign in with your new password.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's own profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -nationalIdHash -emailVerifyToken -passwordResetToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update user's own profile
export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, bio } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update basic fields only - NO profile photo uploads
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (bio !== undefined) user.bio = bio;

    // Profile picture can ONLY be set via face enrollment

    await user.save();
    res.json({ message: 'Profile updated successfully', user: user.toSafeObject() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Store face photo and descriptor from base64 data
export const storeFacePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { faceDescriptor, facePhotoData } = req.body;
    if (!facePhotoData) return res.status(400).json({ message: 'No face photo data provided' });

    // Decode base64 image
    const matches = facePhotoData.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/);
    if (!matches) return res.status(400).json({ message: 'Invalid image data' });
    const ext = matches[2] === 'jpeg' ? 'jpg' : matches[2];
    const buffer = Buffer.from(matches[3], 'base64');

    // Ensure uploads/profiles exists
    const dir = 'uploads/profiles';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Save file
    const filename = `profile-${user._id}-${Date.now()}.${ext}`;
    const filepath = `${dir}/${filename}`;
    fs.writeFileSync(filepath, buffer);

    // Update user
    user.profilePhotoUrl = `/uploads/profiles/${filename}`;
    if (Array.isArray(faceDescriptor) && faceDescriptor.length === 128) {
      user.faceDescriptor = faceDescriptor;
    }
    await user.save();

    res.json({ message: 'Profile picture updated successfully', profilePhotoUrl: user.profilePhotoUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getFaceStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hasFace = !!user.profilePhotoUrl || (Array.isArray(user.faceDescriptor) && user.faceDescriptor.length > 0);
    res.json({ hasFace, profilePhotoUrl: user.profilePhotoUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
