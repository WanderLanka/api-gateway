// middleware/auth.js
import jwt from 'jsonwebtoken';
import { security } from '../config/index.js';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.logger?.warn?.('AUTH: Missing token');
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'AUTH_TOKEN_MISSING'
    });
  }

  jwt.verify(token, security.jwtSecret, (err, user) => {
    if (err) {
      const reason = err.name === 'TokenExpiredError' ? 'expired' : 'invalid';
      req.logger?.warn?.(`AUTH: Token ${reason}: ${err.message}`);
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'AUTH_TOKEN_INVALID'
      });
    }
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
