const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: '🔒 Verify your PublicEye Kenya account',
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:auto;background:#0d0d0d;color:white;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#BB0000,#8B0000);padding:32px;text-align:center;">
          <h1 style="font-size:28px;margin:0;">👁️ PublicEye Kenya</h1>
          <p style="opacity:.7;margin-top:8px;">Fighting corruption, one report at a time</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#C9A84C;">Verify your email</h2>
          <p style="color:rgba(255,255,255,.7);">Hi ${user.firstName}, click the button below to verify your email address and activate your account.</p>
          <a href="${verifyUrl}" style="display:inline-block;margin:24px 0;background:#BB0000;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;">✅ Verify Email</a>
          <p style="font-size:12px;color:rgba(255,255,255,.35);">This link expires in 24 hours. If you didn't register, ignore this email.</p>
        </div>
      </div>
    `,
  });
};

const generateVerifyToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = { sendVerificationEmail, generateVerifyToken };
