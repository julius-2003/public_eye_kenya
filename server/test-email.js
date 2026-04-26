import dotenv from 'dotenv';
dotenv.config();

import { sendWelcomeCitizenEmail } from './src/services/emailService.js';

console.log('🚀 Testing email service...');
console.log('📧 FROM_EMAIL:', process.env.FROM_EMAIL);
console.log('🔑 API_KEY:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');

await sendWelcomeCitizenEmail('mainajulius696@gmail.com', 'Test User');
console.log('✅ Test completed! Check your email inbox.');
