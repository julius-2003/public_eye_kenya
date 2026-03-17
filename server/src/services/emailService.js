// 📧 Email Service - Mock Mode (Nodemailer disabled)
// All email functions log to console instead of sending real emails

const LOG_PREFIX = '📧 [EMAIL SERVICE - DEV MODE]';

export const sendVerificationEmail = async (to, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  console.log(`${LOG_PREFIX} Verification email:`, { to, url });
};

export const sendPasswordResetEmail = async (to, resetUrl, resetToken) => {
  console.log(`${LOG_PREFIX} Password reset email:`, { to, resetToken, resetUrl });
};

export const sendWhistleblowerAlert = async ({ reportTitle, county, reportId }) => {
  const recipients = ['ethics@eacc.go.ke', 'info@dci.go.ke', 'news@nation.co.ke', 'info@tikenya.org'];
  console.log(`${LOG_PREFIX} Whistleblower alert: "${reportTitle}" (${county}) → ${recipients.join(', ')}`);
};

export const sendCountyAdminApprovalEmail = async (superAdminEmail, user, approvalLink) => {
  console.log(`${LOG_PREFIX} County admin approval email:`, {
    to: superAdminEmail,
    adminName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    county: user.assignedCounty,
    approvalLink
  });
};

export const sendCountyAdminApprovedEmail = async (countyAdminEmail, adminName, county) => {
  console.log(`${LOG_PREFIX} County admin approved email:`, {
    to: countyAdminEmail,
    adminName,
    county,
    dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/admin`
  });
};

export const sendWelcomeCitizenEmail = async (to, firstName) => {
  console.log(`${LOG_PREFIX} Welcome citizen email:`, {
    to,
    firstName,
    dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`
  });
};

export const sendWelcomeCountyAdminEmail = async (to, firstName, county) => {
  console.log(`${LOG_PREFIX} Welcome county admin email:`, {
    to,
    firstName,
    county,
    loginUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`
  });
};
