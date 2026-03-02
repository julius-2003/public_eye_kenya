import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

export const sendVerificationEmail = async (to, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"PublicEye Kenya" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify your PublicEye account',
    html: `
      <div style="background:#0d0d0d;color:white;padding:40px;font-family:sans-serif;max-width:600px;">
        <h1 style="color:#BB0000;">PublicEye Kenya</h1>
        <p>Verify your account to start reporting corruption.</p>
        <a href="${url}" style="background:#BB0000;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:20px 0;">Verify Email</a>
        <p style="color:#666;font-size:12px;">Link expires in 24 hours.</p>
      </div>
    `
  });
};

export const sendWhistleblowerAlert = async ({ reportTitle, county, reportId }) => {
  const recipients = [
    'ethics@eacc.go.ke', 'info@dci.go.ke', 'news@nation.co.ke', 'info@tikenya.org'
  ];
  // In production send to real orgs; in dev just log
  console.log(`📡 Whistleblower alert: "${reportTitle}" (${county}) → ${recipients.join(', ')}`);
};
