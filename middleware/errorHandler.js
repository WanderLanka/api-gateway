// middleware/errorHandler.js
import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred ❌:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    message: 'Internal Server Error',
    status: 500,
    code: 'INTERNAL_ERROR'
  };

  // Handle specific error types
  if (err.code === 'ECONNREFUSED') {
    error = {
      message: 'Service temporarily unavailable',
      status: 503,
      code: 'SERVICE_UNAVAILABLE'
    };
  } else if (err.code === 'ENOTFOUND') {
    error = {
      message: 'Service not found',
      status: 503,
      code: 'SERVICE_NOT_FOUND'
    };
  } else if (err.code === 'ETIMEDOUT') {
    error = {
      message: 'Service timeout',
      status: 504,
      code: 'SERVICE_TIMEOUT'
    };
  } else if (err.name === 'ValidationError') {
    error = {
      message: 'Validation Error',
      status: 400,
      code: 'VALIDATION_ERROR',
      details: err.details
    };
  } else if (err.status) {
    error = {
      message: err.message,
      status: err.status,
      code: err.code || 'CUSTOM_ERROR'
    };
  }

  res.status(error.status).json({
    success: false,
    error: error.message,
    code: error.code,
    timestamp: new Date().toISOString(),
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const notFoundHandler = (req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'ROUTE_NOT_FOUND',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

export { errorHandler, notFoundHandler };
