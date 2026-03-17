const crypto = require('crypto');

// Mock email service - Nodemailer disabled for development
const sendVerificationEmail = async (user, token) => {
  const verifyUrl = ${process.env.CLIENT_URL}/verify-email?token=;
  console.log(' [EMAIL SERVICE - DEV MODE] Verification email:', {
    to: user.email,
    name: user.firstName,
    verifyUrl
  });
};

const generateVerifyToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = { sendVerificationEmail, generateVerifyToken };
