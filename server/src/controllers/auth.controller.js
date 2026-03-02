import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { sendVerificationEmail } from '../services/emailService.js';

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, nationalId, county } = req.body;

    if (!email || !password || !firstName || !lastName || !phone || !nationalId || !county) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const nationalIdHash = await bcrypt.hash(nationalId, 12);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Auto-assign superadmin if matches env
    let role = 'citizen';
    if (email === process.env.SUPERADMIN_EMAIL) role = 'superadmin';

    const user = await User.create({
      email, password, firstName, lastName, phone,
      nationalIdHash, county, role,
      emailVerifyToken: verifyToken,
      emailVerifyExpires: verifyExpires
    });

    await sendVerificationEmail(email, verifyToken);

    res.status(201).json({
      message: 'Registration successful. Check your email to verify your account.',
      userId: user._id
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.isSuspended) return res.status(403).json({ message: 'Account suspended', suspended: true });

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
