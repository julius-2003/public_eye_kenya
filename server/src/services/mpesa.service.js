const axios = require('axios');
const { getMpesaToken, getMpesaTimestamp, getMpesaPassword, MPESA_BASE } = require('../config/mpesa');
const SupportPayment = require('../models/SupportPayment');
const { v4: uuidv4 } = require('uuid');

const initiateStkPush = async ({ phone, amount, userId, alias }) => {
  const token = await getMpesaToken();
  const timestamp = getMpesaTimestamp();
  const password = getMpesaPassword(timestamp);

  // Format phone: 07xx -> 2547xx
  const formattedPhone = phone.replace(/^0/, '254');

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.ceil(amount),
    PartyA: formattedPhone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: 'PublicEyeKenya',
    TransactionDesc: 'Support PublicEye Kenya',
  };

  const res = await axios.post(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Save payment record
  const payment = await SupportPayment.create({
    user: userId,
    alias,
    method: 'stk_push',
    phone: formattedPhone,
    amount,
    checkoutRequestId: res.data.CheckoutRequestID,
    merchantRequestId: res.data.MerchantRequestID,
    status: 'PENDING',
  });

  return {
    paymentId: payment._id,
    checkoutRequestId: res.data.CheckoutRequestID,
    message: 'STK Push sent to your phone. Enter your M-Pesa PIN to complete.',
  };
};

const handleCallback = async (body) => {
  const { Body: { stkCallback } } = body;
  const payment = await SupportPayment.findOne({ checkoutRequestId: stkCallback.CheckoutRequestID });
  if (!payment) return;

  if (stkCallback.ResultCode === 0) {
    const items = stkCallback.CallbackMetadata.Item;
    const receipt = items.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
    payment.status = 'SUCCESS';
    payment.mpesaReceiptNumber = receipt;
    payment.completedAt = new Date();
    payment.callbackData = stkCallback;
  } else {
    payment.status = 'FAILED';
    payment.failReason = stkCallback.ResultDesc;
    payment.callbackData = stkCallback;
  }
  await payment.save();
  return payment;
};

module.exports = { initiateStkPush, handleCallback };
