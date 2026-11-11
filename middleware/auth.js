import jwt from 'jsonwebtoken';
import { security } from '../config/index.js';

function decodeAccessToken(req) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || '');
  if (!match) return null;
  const user = jwt.verify(match[1], security.jwtSecret, { algorithms: ['HS256'] });
  if (!user.userId || user.type === 'refresh') throw new Error('Access token required');
  return user;
}

export function authenticateToken(req, res, next) {
  try {
    const user = decodeAccessToken(req);
    if (!user) return res.status(401).json({ error: 'Access token required', code: 'AUTH_TOKEN_MISSING' });
    req.user = user;
    return next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token', code: 'AUTH_TOKEN_INVALID' });
  }
}

export function optionalAuth(req, res, next) {
  try {
    const user = decodeAccessToken(req);
    if (user) req.user = user;
  } catch { /* Public reads remain available without a valid access token. */ }
  return next();
}
