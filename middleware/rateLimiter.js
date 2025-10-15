// middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';
import { security } from '../config/index.js';

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs: windowMs || security.rateLimit.windowMs,
    max: max || security.rateLimit.max,
    message: message || {
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.ip + ':' + req.path;
    }
  });
};

// Different rate limits for different endpoints
const generalLimiter = createRateLimiter();
const authLimiter = createRateLimiter(900000, 5, {
  error: 'Too many authentication attempts',
  code: 'AUTH_RATE_LIMIT_EXCEEDED'
});
const strictLimiter = createRateLimiter(900000, 10, {
  error: 'Rate limit exceeded for this endpoint',
  code: 'STRICT_RATE_LIMIT_EXCEEDED'
});

export {
  createRateLimiter,
  generalLimiter,
  authLimiter,
  strictLimiter
};
