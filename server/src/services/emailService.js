import nodemailer from 'nodemailer';

// ✅ Lazy transporter — created on first use so dotenv is already loaded
let _transporter = null;

function getTransporter() {
  if (!_transporter) {
    console.log('📧 Creating email transporter with HOST:', process.env.EMAIL_HOST, 'PORT:', process.env.EMAIL_PORT);
    try {
      _transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } catch (err) {
      console.error('Failed to create transporter:', err.message);
      return null;
    }
  }
  return _transporter;
}

export const sendVerificationEmail = async (to, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const t = getTransporter();
  if (t) {
    try {
      await t.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: 'Verify your PublicEye account',
        html: `
          <div style="background:#0d0d0d;color:white;padding:40px;font-family:sans-serif;max-width:600px;">
            <h1 style="color:#BB0000;">PublicEye Kenya</h1>
            <p>Welcome to PublicEye Kenya! Please verify your email to proceed.</p>
            <a href="${url}" style="background:#BB0000;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:20px 0;">Verify Email</a>
            <p style="color:#666;font-size:12px;">Link expires in 24 hours.</p>
          </div>
        `
      });
      return;
    } catch (err) {
      console.error('Nodemailer failed:', err.message);
    }
  }
  console.warn('Email not sent. Fallback:');
  console.log(`To: ${to}\nSubject: Verify your PublicEye account\nLink: ${url}`);
};

export const sendPasswordResetEmail = async (to, resetUrl, resetToken) => {
  const t = getTransporter();
  if (t) {
    try {
      await t.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: 'Reset your PublicEye password',
        html: `
          <div style="background:#0d0d0d;color:white;padding:40px;font-family:sans-serif;max-width:600px;">
            <h1 style="color:#BB0000;">PublicEye Kenya</h1>
            <p>You requested to reset your password. Here's your reset code:</p>
            <div style="background:rgba(255,255,255,0.1);padding:20px;border-radius:8px;margin:20px 0;font-family:monospace;font-size:18px;text-align:center;word-break:break-all;">
              ${resetToken}
            </div>
            <p style="color:#999;margin:20px 0;">Or click the link below:</p>
            <a href="${resetUrl}" style="background:#0fb528;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:20px 0;">Reset Password</a>
            <p style="color:#666;font-size:12px;">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
          </div>
        `
      });
      return;
    } catch (err) {
      console.error('Nodemailer failed:', err.message);
    }
  }
  console.warn('Email not sent. Fallback:');
  console.log(`To: ${to}\nSubject: Reset your PublicEye password\nReset code: ${resetToken}\nLink: ${resetUrl}`);
};

export const sendWhistleblowerAlert = async ({ reportTitle, county, reportId }) => {
  const recipients = ['ethics@eacc.go.ke', 'info@dci.go.ke', 'news@nation.co.ke', 'info@tikenya.org'];
  console.log(`📡 Whistleblower alert: "${reportTitle}" (${county}) → ${recipients.join(', ')}`);
};

export const sendCountyAdminApprovalEmail = async (superAdminEmail, user, approvalLink) => {
  const t = getTransporter();
  if (!t) { console.warn('Email not sent: no transporter'); return; }
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM,
      to: superAdminEmail,
      subject: `New County Admin Registration Request - ${user.firstName} ${user.lastName}`,
      html: `
        <div style="background:#0d0d0d;color:white;padding:40px;font-family:sans-serif;max-width:600px;">
          <h1 style="color:#BB0000;">PublicEye Kenya - Pending Approval</h1>
          <h2 style="color:#0fb528;">New County Admin Registration</h2>
          <div style="background:rgba(255,255,255,0.1);padding:20px;border-radius:8px;margin:20px 0;">
            <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Phone:</strong> ${user.phone}</p>
            <p><strong>County:</strong> ${user.assignedCounty}</p>
            <p><strong>Registration Date:</strong> ${user.countyAdminRequestedAt.toLocaleDateString()}</p>
          </div>
          <a href="${approvalLink}" style="background:#0fb528;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:20px 0;">Review Pending Approvals</a>
        </div>
      `
    });
  } catch (err) { console.error('sendCountyAdminApprovalEmail failed:', err.message); }
};

export const sendCountyAdminApprovedEmail = async (countyAdminEmail, adminName, county) => {
  const t = getTransporter();
  if (!t) { console.warn('Email not sent: no transporter'); return; }
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM,
      to: countyAdminEmail,
      subject: '✅ Welcome to PublicEye Kenya - County Admin Access Granted',
      html: `
        <div style="background:#0d0d0d;color:white;padding:40px;font-family:sans-serif;max-width:600px;">
          <h1 style="color:#BB0000;">PublicEye Kenya</h1>
          <h2 style="color:#0fb528;">Welcome, ${adminName}!</h2>
          <div style="background:rgba(15,181,40,0.2);border-left:4px solid #0fb528;padding:20px;border-radius:8px;margin:20px 0;">
            <p style="margin:0;font-weight:bold;">🎉 Your account has been approved!</p>
            <p style="margin:10px 0 0 0;font-size:14px;color:#0fb528;">You are now a County Admin for ${county}</p>
          </div>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/admin" style="background:#0fb528;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:20px 0;font-weight:bold;">Go to Admin Dashboard</a>
        </div>
      `
    });
  } catch (err) { console.error('sendCountyAdminApprovedEmail failed:', err.message); }
};

export const sendWelcomeCitizenEmail = async (to, firstName) => {
  const t = getTransporter();
  if (!t) { console.warn('Email not sent: no transporter'); return; }
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: '🎉 Welcome to PublicEye Kenya - Fight Corruption with Anonymity',
      html: `
        <div style="background:#0d0d0d;color:white;padding:40px;font-family:sans-serif;max-width:600px;">
          <h1 style="color:#BB0000;">PublicEye Kenya</h1>
          <h2 style="color:#0fb528;">Welcome, ${firstName}!</h2>
          <div style="background:rgba(187,0,0,0.15);border-left:4px solid #BB0000;padding:20px;border-radius:8px;margin:20px 0;">
            <p style="margin:0;font-weight:bold;">🎯 Your voice matters.</p>
            <p style="margin:10px 0 0 0;font-size:14px;">Report corruption safely and anonymously. Your identity is always protected.</p>
          </div>
          <ul style="margin:15px 0;padding-left:20px;line-height:2;">
            <li>📝 <strong>Submit Reports</strong></li>
            <li>💬 <strong>Join County Chat</strong></li>
            <li>🗺️ <strong>View Heatmap</strong></li>
            <li>🏆 <strong>Check Scoreboard</strong></li>
          </ul>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="background:#BB0000;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:20px 0;font-weight:bold;">Go to Dashboard</a>
        </div>
      `
    });
  } catch (err) { console.error('sendWelcomeCitizenEmail failed:', err.message); }
};

export const sendWelcomeCountyAdminEmail = async (to, firstName, county) => {
  const t = getTransporter();
  if (!t) { console.warn('Email not sent: no transporter'); return; }
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: '🛡️ Welcome to PublicEye Kenya - County Admin Registration Submitted',
      html: `
        <div style="background:#0d0d0d;color:white;padding:40px;font-family:sans-serif;max-width:600px;">
          <h1 style="color:#BB0000;">PublicEye Kenya</h1>
          <h2 style="color:#0fb528;">Welcome, ${firstName}!</h2>
          <div style="background:rgba(15,181,40,0.15);border-left:4px solid #0fb528;padding:20px;border-radius:8px;margin:20px 0;">
            <p style="margin:0;font-weight:bold;">✅ Your registration has been received!</p>
            <p style="margin:10px 0 0 0;font-size:14px;color:#0fb528;">For: ${county} County</p>
          </div>
          <p>Our Super Admin will review your application within 1-2 business days. You'll receive an email once approved.</p>
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="background:#0fb528;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:20px 0;font-weight:bold;">Log In to My Account</a>
        </div>
      `
    });
  } catch (err) { console.error('sendWelcomeCountyAdminEmail failed:', err.message); }
};
