import mongoose from 'mongoose';

const supportPaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  phone: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['stk', 'pochi', 'till'], required: true },
  status: { type: String, enum: ['pending', 'success', 'failed'], default: 'pending' },
  merchantRequestId: { type: String },
  checkoutRequestId: { type: String },
  mpesaReceiptNumber: { type: String },
  resultDesc: { type: String },
  completedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model('SupportPayment', supportPaymentSchema);
