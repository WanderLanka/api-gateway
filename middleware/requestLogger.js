// middleware/logger.js
import logger from '../utils/logger.js';

const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log incoming request
  logger.info('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type'),
    hasAuth: !!req.get('authorization'),
    origin: req.get('origin')
  });

  // Log request body for POST/PUT/PATCH requests (but not sensitive data)
  if (req.body && Object.keys(req.body).length > 0 && 
      ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    ['password', 'token', 'secret', 'key'].forEach(field => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '[REDACTED]';
      }
    });
    logger.debug('Request body', sanitizedBody);
  }

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed ✅', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length')
    });
  });

  next();
};

export default requestLogger;
