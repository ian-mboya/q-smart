const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { 
      userId, 
      role,
      iss: 'q-smart-api',
      aud: 'q-smart-users'
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      algorithm: 'HS256'
    }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'q-smart-api',
      audience: 'q-smart-users'
    });
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Extract token from header
const getTokenFromHeader = (header) => {
  if (header && header.startsWith('Bearer ')) {
    return header.substring(7); // Remove 'Bearer ' prefix
  }
  return null;
};

module.exports = {
  generateToken,
  verifyToken,
  getTokenFromHeader
};