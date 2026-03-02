import SupportPayment from '../models/SupportPayment.js';
import { initiateStkPush } from '../services/mpesaService.js';

export const initiatePayment = async (req, res) => {
  try {
    const { phone, amount, method } = req.body;
    if (!phone || !amount || !method) return res.status(400).json({ message: 'phone, amount, method required' });

    const payment = await SupportPayment.create({
      userId: req.user?._id,
      phone, amount: parseInt(amount), method, status: 'pending'
    });

    if (method === 'stk') {
      const result = await initiateStkPush({ phone, amount: parseInt(amount), accountRef: 'PublicEye', paymentId: payment._id });
      payment.merchantRequestId = result.MerchantRequestID;
      payment.checkoutRequestId = result.CheckoutRequestID;
      await payment.save();
    }

    res.json({
      paymentId: payment._id,
      method,
      pochiPhone: process.env.POCHI_PHONE,
      tillNumber: process.env.TILL_NUMBER,
      status: 'pending'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStatus = async (req, res) => {
  try {
    const payment = await SupportPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json({ status: payment.status, receipt: payment.mpesaReceiptNumber });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const mpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body;
    const stkCallback = Body?.stkCallback;
    if (!stkCallback) return res.json({ ResultCode: 0 });

    const { MerchantRequestID, CheckoutRequestID, ResultCode, CallbackMetadata } = stkCallback;

    const payment = await SupportPayment.findOne({ merchantRequestId: MerchantRequestID });
    if (!payment) return res.json({ ResultCode: 0 });

    if (ResultCode === 0) {
      const meta = {};
      CallbackMetadata?.Item?.forEach(i => { meta[i.Name] = i.Value; });
      payment.status = 'success';
      payment.mpesaReceiptNumber = meta.MpesaReceiptNumber;
      payment.completedAt = new Date();
      // Update user total donated
      if (payment.userId) {
        const User = (await import('../models/User.js')).default;
        await User.findByIdAndUpdate(payment.userId, { $inc: { totalDonated: payment.amount } });
      }
    } else {
      payment.status = 'failed';
      payment.resultDesc = stkCallback.ResultDesc;
    }
    await payment.save();

    // Emit socket event
    // io is not available here directly; the client polls instead
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('M-Pesa callback error:', err.message);
    res.json({ ResultCode: 0 });
  }
};
