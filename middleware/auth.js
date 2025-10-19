// middleware/auth.js
import jwt from 'jsonwebtoken';
import { security } from '../config/index.js';

const authenticateToken = (req, res, next) => {
  console.log('🔐 API Gateway Auth Middleware - Incoming request:', {
    method: req.method,
    url: req.url,
    path: req.path,
    headers: {
      authorization: req.headers['authorization'] ? 'Present' : 'Missing',
      'x-platform': req.headers['x-platform']
    }
  });
  
  // TEMPORARY: Skip auth for debugging booking endpoint
  if (req.path.includes('/addBooking')) {
    console.log('🚨 BYPASSING AUTH FOR DEBUGGING - /addBooking endpoint');
    req.user = { userId: 'debug-user', username: 'debug', role: 'traveler', platform: 'web' };
    return next();
  }
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ No token provided in request');
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'AUTH_TOKEN_MISSING'
    });
  }

  console.log('🔍 Token found, verifying with JWT secret...');
  console.log('JWT Secret being used:', security.jwtSecret);
  console.log('Token (first 50 chars):', token.substring(0, 50) + '...');

  jwt.verify(token, security.jwtSecret, (err, user) => {
    if (err) {
      console.log('❌ Token verification failed:', {
        error: err.message,
        name: err.name,
        expiredAt: err.expiredAt
      });
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'AUTH_TOKEN_INVALID'
      });
    }
    
    console.log('✅ Token verified successfully, user:', {
      userId: user.userId,
      username: user.username,
      role: user.role,
      platform: user.platform
    });
    
    req.user = user;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, security.jwtSecret, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

export { authenticateToken, optionalAuth };
