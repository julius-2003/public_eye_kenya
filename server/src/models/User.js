import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 8 },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  nationalIdHash: { type: String, required: true, unique: true },
  county: { type: String, required: true },
  anonymousAlias: { type: String, unique: true }, // Citizen#4821
  bio: { type: String, default: '' }, // User bio/about section
  
  // Profile & Media
  
  // Auth
  emailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String },
  emailVerifyExpires: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  
  // Role system
  role: { type: String, enum: ['citizen', 'countyadmin', 'superadmin'], default: 'citizen' },
  assignedCounty: { type: String, default: null }, // for countyadmin
  isVerifiedCountyAdmin: { type: Boolean, default: false }, // County admin must be verified by super admin
  verifiedByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verifiedAt: { type: Date, default: null },
  
  // County Admin Registration Flow
  countyAdminRequestedAt: { type: Date, default: null }, // When they applied for county admin
  
  // Admin Settings
  darajani: { type: String, default: 'standard' }, // Tier level (standard, premium, etc)
  tillNumber: { type: String, default: '' }, // Till number for M-Pesa payments
  supportPaymentName: { type: String, default: 'Support PublicEye' }, // Custom name for support/donation feature
  supportPaymentEnabled: { type: Boolean, default: true }, // Can be toggled by super admin or county admin
  pochiCompanyName: { type: String, default: 'PublicEye Kenya' }, // Company name for pochi la biashara
  pochiPhoneNumber: { type: String, default: '' }, // Phone number for pochi la biashara
  
  // Chat Control
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Suspension
  isSuspended: { type: Boolean, default: false },
  suspendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  suspendedAt: { type: Date },
  suspendReason: { type: String },
  
  // Stats
  totalReports: { type: Number, default: 0 },
  totalVotes: { type: Number, default: 0 },
  totalDonated: { type: Number, default: 0 },
  taskForceCount: { type: Number, default: 0 },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Generate anonymous alias
userSchema.pre('save', async function (next) {
  if (!this.anonymousAlias) {
    const num = Math.floor(1000 + Math.random() * 9000);
    this.anonymousAlias = `Citizen#${num}`;
  }
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.nationalIdHash;
  delete obj.faceDescriptor;
  delete obj.emailVerifyToken;
  delete obj.passwordResetToken;
  return obj;
};

export default mongoose.model('User', userSchema);
