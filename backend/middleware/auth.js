const { getTokenFromHeader, verifyToken } = require('../utils/jwtUtils');

// protect middleware (ensure req.user is set)
exports.protect = (req, res, next) => {
  try {
    const header = req.headers.authorization || req.headers.Authorization;
    const token = getTokenFromHeader(header);
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const payload = verifyToken(token);
    // attach minimal info
    // note: payload should contain userId and role from your jwtUtils.generateToken
    req.user = { id: payload.userId || payload.id, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized' });
  }
};

// restrictTo factory: allows only users with any of the given roles
exports.restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Forbidden: insufficient role' });
    }
    next();
  };
};