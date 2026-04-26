import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// Standard Safaricom Sandbox Test Credentials
const SHORTCODE = '174379';
const PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

// Your App Credentials from .env
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;

const phone = process.argv[2];

if (!phone || !phone.match(/^(?:254|\+254|0)?(7[0-9]{8}|1[0-9]{8})$/)) {
    console.log('❌ Please provide a valid Kenyan phone number. Example: node test-mpesa.js 254712345678');
    process.exit(1);
}

if (!CONSUMER_KEY || CONSUMER_KEY === 'your-daraja-key') {
    console.log('❌ Please update MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in server/.env with your Sandbox App credentials.');
    process.exit(1);
}

async function runTest() {
    try {
        console.log('🔄 Getting Daraja Access Token...');
        const creds = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
        const tokenRes = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: { Authorization: `Basic ${creds}` }
        });
        const token = tokenRes.data.access_token;
        console.log('✅ Token acquired!');

        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

        const formattedPhone = phone.startsWith('0') ? `254${phone.slice(1)}` : phone.replace('+', '');

        console.log(`📲 Sending STK Push prompt to ${formattedPhone} for KSh 1...`);
        const stkRes = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
            BusinessShortCode: SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: 1, // KSh 1 for testing
            PartyA: formattedPhone,
            PartyB: SHORTCODE,
            PhoneNumber: formattedPhone,
            CallBackURL: 'https://mydomain.com/path', // Dummy callback for this test
            AccountReference: 'TestPrompt',
            TransactionDesc: 'Test STK Push'
        }, { 
            headers: { Authorization: `Bearer ${token}` } 
        });

        console.log('✅ Success! The prompt should appear on the phone shortly.');
        console.log('Response:', stkRes.data);

    } catch (error) {
        console.error('❌ Failed!');
        console.error(error.response?.data || error.message);
    }
}

runTest();
