export const emailVerify = (req, res, next) => {
  // Email verification disabled - all users are auto-verified on registration
  next();
};
