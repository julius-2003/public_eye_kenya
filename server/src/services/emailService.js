/**
 * emailService.js  —  PublicEye Kenya
 * Powered by Nodemailer with Gmail SMTP
 *
 * Required env vars:
 *   EMAIL_HOST       – SMTP host (smtp.gmail.com)
 *   EMAIL_PORT       – SMTP port (587)
 *   EMAIL_USER       – Gmail email address
 *   EMAIL_PASS       – Gmail app password
 *   EMAIL_FROM       – Sender email address
 *   CLIENT_URL       – your frontend URL   e.g.  https://publiceye.co.ke
 */

import nodemailer from 'nodemailer';

// Lazy-load nodemailer transporter
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
    console.log('🔑 [Nodemailer] Client initialized with host:', process.env.EMAIL_HOST);
  }
  return transporter;
};

const FROM      = process.env.EMAIL_FROM  || 'PublicEye <noreply@publiceye.co.ke>';
const BASE_URL  = process.env.CLIENT_URL  || 'https://publiceye.co.ke';

/* ─────────────── helpers ─────────────── */
const wrap = (bodyHtml) => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>PublicEye Kenya</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#fff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:#0d0d0d;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#111;border-radius:16px;
                    border:1px solid #1e1e1e;overflow:hidden;">
        <!-- header -->
        <tr><td style="padding:24px 32px;border-bottom:1px solid #1e1e1e;
                        background:linear-gradient(135deg,#0d0d0d 0%,#161616 100%);">
          <table role="presentation" width="100%"><tr>
            <td><span style="font-size:20px;font-weight:900;letter-spacing:-0.5px;">
              Public<span style="color:#DC2626;">Eye</span>
              <span style="margin-left:8px;font-size:10px;color:rgba(255,255,255,0.3);
                           letter-spacing:3px;font-weight:600;text-transform:uppercase;">Kenya</span>
            </span></td>
            <td align="right"><span style="background:rgba(220,38,38,0.15);
              border:1px solid rgba(220,38,38,0.35);color:#fca5a5;
              font-size:9px;font-weight:700;padding:4px 10px;border-radius:20px;
              letter-spacing:1.5px;text-transform:uppercase;">Citizen Watchdog</span></td>
          </tr></table>
        </td></tr>
        <!-- body -->
        <tr><td style="padding:32px;">${bodyHtml}</td></tr>
        <!-- footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #1e1e1e;text-align:center;
                        background:#0d0d0d;">
          <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.2);">
            © ${new Date().getFullYear()} PublicEye Kenya · For the citizens, by the citizens
          </p>
          <p style="margin:0;font-size:10px;color:rgba(255,255,255,0.12);">
            <a href="${BASE_URL}" style="color:#DC2626;text-decoration:none;">${BASE_URL}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

const btn = (label, url, hex = '#DC2626') =>
  `<a href="${url}" style="display:inline-block;background:${hex};color:#fff;
   font-weight:700;font-size:13px;padding:13px 28px;border-radius:10px;
   text-decoration:none;margin:18px 0;">${label}</a>`;

const hr = () => `<hr style="border:none;border-top:1px solid #1e1e1e;margin:22px 0;"/>`;

const chip = (text, textCol, bgCol) =>
  `<span style="display:inline-block;background:${bgCol};color:${textCol};
   font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;
   letter-spacing:1px;text-transform:uppercase;">${text}</span>`;

const kvRow = (k, v) =>
  `<tr>
    <td style="padding:10px 18px;font-size:11px;color:rgba(255,255,255,0.35);
               font-weight:600;text-transform:uppercase;letter-spacing:1px;
               border-bottom:1px solid #1a1a1a;white-space:nowrap;">${k}</td>
    <td style="padding:10px 18px;font-size:13px;color:#fff;
               border-bottom:1px solid #1a1a1a;">${v}</td>
  </tr>`;

/* safe send helper — logs on failure, never throws */
const send = async (to, subject, html) => {
  try {
    const result = await getTransporter().sendMail({ 
      from: FROM, 
      to, 
      subject, 
      html,
      replyTo: 'noreply@publiceye.co.ke'
    });
    console.log(`✅ [EmailService] Email sent successfully to ${to}:`, result.messageId);
    return result;
  } catch (err) {
    console.error(`❌ [EmailService] Failed to send to ${to}`);
    console.error(`   From: ${FROM}`);
    console.error(`   Error: ${err.message}`);
    console.error(`   Full Error:`, err);
  }
};

const sendMany = async (list, subject, html) => {
  for (const addr of list) await send(addr, subject, html);
};

/* ─────────────── 1. Welcome — Citizen ─────────────── */
export const sendWelcomeCitizenEmail = async (to, firstName) => {
  console.log(`📧 [EmailService] Sending welcome email to ${to}...`);
  const html = wrap(`
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;">Welcome, ${firstName}! 👋</h2>
    <p style="margin:0 0 22px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">
      You've joined Kenya's citizen watchdog network. Your voice matters.
    </p>${hr()}
    <table role="presentation" width="100%">
      ${[
        ['🎭','Submit reports anonymously','Your identity is always protected'],
        ['💬','Chat with your county','Discuss issues in real time'],
        ['🗺️','View the corruption heatmap','See hotspots across Kenya'],
        ['🏆','Earn scoreboard points','Get recognised for civic action'],
      ].map(([i,t,d])=>`
        <tr>
          <td style="padding:10px 0;width:36px;font-size:22px;vertical-align:top;">${i}</td>
          <td style="padding:10px 0 10px 10px;vertical-align:top;">
            <strong style="font-size:13px;color:#fff;">${t}</strong><br/>
            <span style="font-size:12px;color:rgba(255,255,255,0.35);">${d}</span>
          </td>
        </tr>`).join('')}
    </table>${hr()}
    ${btn('Open My Dashboard →', `${BASE_URL}/dashboard`)}
  `);
  await send(to, '👁️ Welcome to PublicEye Kenya — Your Voice Matters', html);
};

/* ─────────────── 2. Email Verification ─────────────── */
export const sendVerificationEmail = async (to, token) => {
  const url = `${BASE_URL}/verify-email?token=${token}`;
  const html = wrap(`
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;">Verify your email 📧</h2>
    <p style="margin:0 0 22px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">
      Click the button below to activate your PublicEye account.
    </p>
    ${btn('Verify My Email →', url, '#2563EB')}${hr()}
    <p style="font-size:12px;color:rgba(255,255,255,0.3);margin:0 0 8px;">
      This link expires in <strong style="color:#fde68a;">24 hours</strong>.
      If you didn't sign up, you can safely ignore this email.
    </p>
    <p style="font-size:10px;color:rgba(255,255,255,0.18);word-break:break-all;margin:0;">
      Or copy: ${url}
    </p>
  `);
  await send(to, '✅ Verify your PublicEye email address', html);
};

/* ─────────────── 3. Password Reset ─────────────── */
export const sendPasswordResetEmail = async (to, resetUrl, resetToken) => {
  const html = wrap(`
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;">Reset your password 🔒</h2>
    <p style="margin:0 0 22px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">
      We received a request to reset your PublicEye password.
      Click below to create a new one.
    </p>
    ${btn('Reset My Password →', resetUrl, '#7C3AED')}${hr()}
    <p style="font-size:12px;color:rgba(255,255,255,0.3);margin:0 0 8px;">
      This link expires in <strong style="color:#fca5a5;">1 hour</strong>.
      If you didn't request this, your account is safe — just ignore this email.
    </p>
    ${resetToken ? `<p style="font-size:10px;color:rgba(255,255,255,0.18);margin:0;">
      Token: <code style="color:#fde68a;">${resetToken}</code></p>` : ''}
  `);
  await send(to, '🔒 Reset your PublicEye password', html);
};

/* ─────────────── 4. Whistleblower Alert ─────────────── */
export const sendWhistleblowerAlert = async ({ reportTitle, county }) => {
  const recipients = [
    'ethics@eacc.go.ke','info@dci.go.ke',
    'news@nation.co.ke','info@tikenya.org',
  ];
  const html = wrap(`
    <div style="background:rgba(220,38,38,0.1);border:1px solid rgba(220,38,38,0.3);
                border-radius:12px;padding:20px;margin-bottom:22px;">
      ${chip('🚨 Whistleblower Alert','#fca5a5','rgba(220,38,38,0.2)')}
      <h2 style="margin:12px 0 4px;font-size:18px;font-weight:900;color:#fca5a5;">${reportTitle}</h2>
      <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.4);">
        County: <strong style="color:#fff;">${county}</strong>
      </p>
    </div>
    <p style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;margin:0 0 18px;">
      A report on PublicEye Kenya has been escalated and flagged as a potential
      whistleblower case requiring your attention.
    </p>
    ${btn('View on PublicEye →', `${BASE_URL}/report`, '#DC2626')}
  `);
  await sendMany(
    recipients,
    `🚨 Whistleblower Alert: "${reportTitle}" — ${county} County`,
    html,
  );
};

/* ─────────────── 5. County Admin Approval Request ─────────────── */
export const sendCountyAdminApprovalEmail = async (superAdminEmail, user, approvalLink) => {
  const html = wrap(`
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;">New County Admin Request 🛡️</h2>
    <p style="margin:0 0 22px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">
      A citizen has applied for county admin privileges and needs your approval.
    </p>
    <table role="presentation" width="100%"
           style="background:rgba(255,255,255,0.03);border:1px solid #1e1e1e;border-radius:12px;
                  margin-bottom:22px;border-collapse:collapse;">
      ${kvRow('Name',`${user.firstName} ${user.lastName}`)}
      ${kvRow('Email', user.email)}
      ${kvRow('County', user.assignedCounty)}
      ${kvRow('Applied', new Date().toLocaleDateString('en-KE',{dateStyle:'long'}))}
    </table>
    ${btn('Review & Approve →', approvalLink || `${BASE_URL}/admin/county-admins/pending`, '#7C3AED')}
  `);
  await send(
    superAdminEmail,
    `🛡️ County Admin Request: ${user.firstName} ${user.lastName} — ${user.assignedCounty}`,
    html,
  );
};

/* ─────────────── 6. County Admin Approved ─────────────── */
export const sendCountyAdminApprovedEmail = async (countyAdminEmail, adminName, county) => {
  const html = wrap(`
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;">
      Congratulations, ${adminName}! 🎉
    </h2>
    <p style="margin:0 0 16px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">
      Your county admin application for
      <strong style="color:#93c5fd;">${county} County</strong>
      has been approved by a super administrator.
    </p>
    <div style="background:rgba(37,99,235,0.1);border:1px solid rgba(37,99,235,0.3);
                border-radius:12px;padding:18px;margin-bottom:22px;">
      <p style="margin:0;font-size:13px;color:#93c5fd;line-height:1.7;">
        You can now manage reports, moderate chats, and oversee civic activity
        in <strong>${county}</strong>. Use this power responsibly.
      </p>
    </div>
    ${btn('Open Admin Dashboard →', `${BASE_URL}/admin`, '#2563EB')}
  `);
  await send(
    countyAdminEmail,
    `✅ You're now the ${county} County Admin on PublicEye`,
    html,
  );
};

/* ─────────────── 7. Welcome County Admin ─────────────── */
export const sendWelcomeCountyAdminEmail = async (to, firstName, county) => {
  const html = wrap(`
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;">
      Welcome to the admin team, ${firstName}! 👑
    </h2>
    <p style="margin:0 0 22px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">
      Your account has been set up as County Admin for
      <strong style="color:#93c5fd;">${county}</strong>.
    </p>
    ${btn('Go to Admin Dashboard →', `${BASE_URL}/admin`, '#7C3AED')}
  `);
  await send(to, `👑 Welcome, ${county} County Admin — PublicEye`, html);
};

/* ─────────────── 8. New Report — email admins + county citizens ─────────────── */
export const sendNewReportEmail = async (recipients, { reportTitle, county, severity, category, recipientName }) => {
  const SEV = {
    critical: { text:'#fca5a5', bg:'rgba(220,38,38,0.15)',  border:'rgba(220,38,38,0.3)'  },
    high:     { text:'#fdba74', bg:'rgba(234,88,12,0.15)',   border:'rgba(234,88,12,0.3)'  },
    medium:   { text:'#fde68a', bg:'rgba(217,119,6,0.15)',   border:'rgba(217,119,6,0.3)'  },
    low:      { text:'#86efac', bg:'rgba(22,163,74,0.12)',   border:'rgba(22,163,74,0.25)' },
  };
  const sev = SEV[severity] || SEV.medium;
  const html = wrap(`
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;">New report in ${county} 📢</h2>
    <p style="margin:0 0 22px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">
      Hi${recipientName ? ` ${recipientName}` : ''},
      a new corruption report has been submitted in your county.
    </p>
    <div style="background:${sev.bg};border:1px solid ${sev.border};
                border-radius:12px;padding:18px;margin-bottom:22px;">
      ${chip(severity.toUpperCase(), sev.text, sev.bg)}
      <h3 style="margin:10px 0 4px;font-size:16px;font-weight:700;color:#fff;">
        ${reportTitle}
      </h3>
      <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.4);">
        📍 ${county} County &nbsp;·&nbsp; 🏷️ ${category}
      </p>
    </div>
    ${btn('View Report →', `${BASE_URL}/report`, '#DC2626')}
    <p style="font-size:11px;color:rgba(255,255,255,0.2);margin:14px 0 0;">
      You're receiving this as a registered citizen / admin of ${county} County.
    </p>
  `);
  const list = Array.isArray(recipients) ? recipients : [recipients];
  await sendMany(list, `📢 New report in ${county}: "${reportTitle}"`, html);
};

/* ─────────────── 9. New Chat Activity — notify county admins ─────────────── */
export const sendChatNotificationEmail = async (recipients, { county, room, alias, message, recipientName }) => {
  const preview = message.length > 200 ? message.slice(0, 200) + '…' : message;
  const html = wrap(`
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:900;">New message in #${room} 💬</h2>
    <p style="margin:0 0 22px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">
      Hi${recipientName ? ` ${recipientName}` : ''},
      there's new activity in the ${county} county chat.
    </p>
    <div style="background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.2);
                border-radius:12px;padding:18px;margin-bottom:22px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.35);
                text-transform:uppercase;letter-spacing:1px;">
        ${alias} · #${room} · ${county}
      </p>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);font-style:italic;
                line-height:1.6;">
        "${preview}"
      </p>
    </div>
    ${btn('Join the Conversation →', `${BASE_URL}/chat`, '#2563EB')}
  `);
  const list = Array.isArray(recipients) ? recipients : [recipients];
  await sendMany(list, `💬 New activity in ${county} #${room} — PublicEye`, html);
};

/* ─────────────── 10. General Admin Notification ─────────────── */
export const sendAdminNotificationEmail = async (recipients, { title, message, actionUrl, priority, recipientName }) => {
  const COL = {
    critical: { text:'#fca5a5', bg:'rgba(220,38,38,0.15)',  border:'rgba(220,38,38,0.3)'  },
    high:     { text:'#fdba74', bg:'rgba(234,88,12,0.15)',   border:'rgba(234,88,12,0.3)'  },
    normal:   { text:'#93c5fd', bg:'rgba(37,99,235,0.1)',    border:'rgba(37,99,235,0.3)'  },
  };
  const c = COL[priority] || COL.normal;
  const html = wrap(`
    ${chip(priority?.toUpperCase() || 'NOTIFICATION', c.text, c.bg)}
    <h2 style="margin:12px 0 6px;font-size:20px;font-weight:900;">${title}</h2>
    <p style="margin:0 0 22px;font-size:14px;color:rgba(255,255,255,0.45);line-height:1.6;">
      Hi${recipientName ? ` ${recipientName}` : ''},
      you have a new notification on PublicEye.
    </p>
    <div style="background:${c.bg};border:1px solid ${c.border};
                border-radius:12px;padding:18px;margin-bottom:22px;">
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.7;">
        ${message}
      </p>
    </div>
    ${actionUrl ? btn('View Details →', `${BASE_URL}${actionUrl}`, '#DC2626') : ''}
  `);
  const list = Array.isArray(recipients) ? recipients : [recipients];
  await sendMany(list, `🔔 ${title} — PublicEye`, html);
};

/* ─────────────── 11. Generic Email — for testing & custom sends ─────────────── */
export const sendGenericEmail = async (to, subject, html) => {
  try {
    const response = await getResend().emails.send({
      from: FROM,
      to,
      subject,
      html,
    });
    return { success: true, id: response.id };
  } catch (err) {
    console.error(`[EmailService] Failed to send → ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};
