import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 8 },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  nationalIdHash: { type: String, required: true },
  county: { type: String, required: true },
  anonymousAlias: { type: String, unique: true }, // Citizen#4821
  faceDescriptor: { type: [Number], default: [] },
  facePhotoUrl: { type: String },
  // Auth
  emailVerified: { type: Boolean, default: false },
  emailVerifyToken: { type: String },
  emailVerifyExpires: { type: Date },
  // Role system (v5)
  role: { type: String, enum: ['citizen', 'countyadmin', 'superadmin'], default: 'citizen' },
  assignedCounty: { type: String, default: null }, // for countyadmin
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
  return obj;
};

export default mongoose.model('User', userSchema);
