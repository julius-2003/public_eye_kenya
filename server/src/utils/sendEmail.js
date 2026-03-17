const crypto = require('crypto');

// Mock send email - Nodemailer disabled for development
const sendEmail = async ({ to, subject, html }) => {
  console.log(' [EMAIL SERVICE - DEV MODE] Email:', {
    to,
    subject,
    htmlLength: html?.length
  });
};

module.exports = sendEmail;
