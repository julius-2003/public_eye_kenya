// roleGuard.js — v5 NEW
export const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
  if (!['countyadmin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Super-admin access required' });
  }
  next();
};

// County admin can only access their own county; superadmin can access all
export const requireCountyMatch = (countyParam = 'county') => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
  if (req.user.role === 'superadmin') return next();
  if (req.user.role === 'countyadmin') {
    const requestedCounty = req.params[countyParam] || req.body[countyParam] || req.query[countyParam];
    if (requestedCounty && req.user.assignedCounty !== requestedCounty) {
      return res.status(403).json({ message: 'You can only access your assigned county' });
    }
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};
