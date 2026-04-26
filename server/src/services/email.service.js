import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Initialize nodemailer transporter
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  return transporter;
};

const sendVerificationEmail = async (user, token) => {
  try {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    const transporter = getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'PublicEye <noreply@publiceye.co.ke>',
      to: user.email,
      subject: 'Verify Your Email - PublicEye Kenya',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">Welcome to PublicEye Kenya</h2>
          <p>Hi ${user.firstName},</p>
          <p>Thank you for registering with PublicEye Kenya. Please verify your email address by clicking the link below:</p>
          <p>
            <a href="${verifyUrl}" style="background-color: #DC2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p>${verifyUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ [EMAIL] Verification email sent to:', user.email);
    return result;
  } catch (error) {
    console.error('❌ [EMAIL ERROR] Failed to send verification email:', error.message);
    throw error;
  }
};

const sendPasswordResetEmail = async (user, token) => {
  try {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    const transporter = getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'PublicEye <noreply@publiceye.co.ke>',
      to: user.email,
      subject: 'Reset Your Password - PublicEye Kenya',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">Password Reset Request</h2>
          <p>Hi ${user.firstName},</p>
          <p>You requested to reset your password. Click the link below to proceed:</p>
          <p>
            <a href="${resetUrl}" style="background-color: #DC2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            If you didn't request this, please ignore this email or contact support.
          </p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ [EMAIL] Password reset email sent to:', user.email);
    return result;
  } catch (error) {
    console.error('❌ [EMAIL ERROR] Failed to send password reset email:', error.message);
    throw error;
  }
};

const sendNotificationEmail = async (to, subject, message) => {
  try {
    const transporter = getTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'PublicEye <noreply@publiceye.co.ke>',
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">PublicEye Kenya Notification</h2>
          <p>${message}</p>
          <hr style="border: none; border-top: 1px solid #ccc; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            This is an automated message from PublicEye Kenya.
          </p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ [EMAIL] Notification email sent to:', to);
    return result;
  } catch (error) {
    console.error('❌ [EMAIL ERROR] Failed to send notification email:', error.message);
    throw error;
  }
};

const generateVerifyToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export { sendVerificationEmail, sendPasswordResetEmail, sendNotificationEmail, generateVerifyToken };
