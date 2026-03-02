// suspendCheck.js — v5 NEW
export const suspendCheck = (req, res, next) => {
  if (!req.user) return next();
  if (req.user.isSuspended && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(403).json({
      message: 'Your account has been suspended. Contact support.',
      suspended: true
    });
  }
  next();
};
