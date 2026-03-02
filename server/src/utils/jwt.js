import jwt from 'jsonwebtoken';

export const signToken = (user) => jwt.sign(
  { id: user._id, role: user.role, county: user.county, assignedCounty: user.assignedCounty },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);
