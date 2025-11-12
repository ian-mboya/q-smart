const { verifyToken, getTokenFromHeader } = require('../utils/jwtUtils');
const User = require('../models/User');

// Protect routes - user must be authenticated
const protect = async (req, res, next) => {
  try {
    // 1. Get token from header
    const token = getTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    // 2. Verify token
    const decoded = verifyToken(token);
    
    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'User belonging to this token no longer exists.'
      });
    }

    // 4. Check if user is active
    if (!currentUser.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'User account has been deactivated.'
      });
    }

    // 5. Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: error.message
    });
  }
};

// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};

// Optional auth - doesn't fail if no token, but adds user if available
const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = verifyToken(token);
      const currentUser = await User.findById(decoded.userId);
      if (currentUser && currentUser.isActive) {
        req.user = currentUser;
      }
    }
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

module.exports = {
  protect,
  restrictTo,
  optionalAuth
};