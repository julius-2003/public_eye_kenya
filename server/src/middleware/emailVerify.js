export const emailVerify = (req, res, next) => {
  if (!req.user) return next();
  if (!req.user.emailVerified) {
    return res.status(403).json({ message: 'Please verify your email address first', emailUnverified: true });
  }
  next();
};
