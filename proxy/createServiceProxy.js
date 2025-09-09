import { createProxyMiddleware } from 'http-proxy-middleware';
import logger from '../utils/logger.js';
import serviceRegistry from '../utils/serviceRegistry.js';

function createServiceProxy(serviceName, targetUrl) {
  logger.info(`Creating proxy for ${serviceName}`, { target: targetUrl });
  
  // Create a middleware that checks health before proxying
  return (req, res, next) => {
    // Check if service is healthy before proxying
    if (!serviceRegistry.isServiceHealthy(serviceName.toLowerCase())) {
      logger.warn(`Rejecting request to unhealthy service: ${serviceName}`, {
        service: serviceName,
        url: req.originalUrl,
        method: req.method
      });
      
      return res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable',
        service: serviceName,
        code: 'SERVICE_UNHEALTHY',
        message: `${serviceName} service is currently unhealthy`,
        timestamp: new Date().toISOString(),
        retryAfter: 30 // seconds
      });
    }

    // Service is healthy, create and use the proxy
    const proxy = createProxyMiddleware({
      target: targetUrl,
      changeOrigin: true,
      secure: false,
      timeout: 30000,
      onProxyReq: (proxyReq, req, res) => {
        logger.debug(`Routing to ${serviceName}`, {
          service: serviceName,
          target: `${targetUrl}${req.url}`,
          method: req.method,
          originalUrl: req.originalUrl,
          proxyUrl: req.url
        });
        
        // Handle body for POST/PUT/PATCH requests
        if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
          logger.debug(`Forwarding body to ${serviceName}`, {
            bodySize: Buffer.byteLength(bodyData)
          });
        }
      },
      onProxyRes: (proxyRes, req, res) => {
        logger.info(`Response from ${serviceName}`, {
          service: serviceName,
          status: proxyRes.statusCode,
          statusMessage: proxyRes.statusMessage,
          method: req.method,
          url: req.originalUrl,
          responseHeaders: {
            contentType: proxyRes.headers['content-type'],
            contentLength: proxyRes.headers['content-length']
          }
        });
        
        // Mark service as healthy on successful response
        if (proxyRes.statusCode < 500) {
          const service = serviceRegistry.getService(serviceName.toLowerCase());
          if (service && !service.healthy) {
            serviceRegistry.services.set(serviceName.toLowerCase(), {
              ...service,
              healthy: true,
              lastError: null,
              lastCheck: new Date()
            });
            logger.info(`Service ${serviceName} marked as healthy again`);
          }
        }
        
        // Log response body for debugging (first 500 characters) in development
        if (process.env.NODE_ENV === 'development') {
          let body = '';
          proxyRes.on('data', chunk => {
            body += chunk;
          });
          proxyRes.on('end', () => {
            if (body && body.length > 0) {
              const truncatedBody = body.length > 500 ? body.substring(0, 500) + '...' : body;
              logger.debug(`Response body from ${serviceName}`, {
                service: serviceName,
                bodyPreview: truncatedBody
              });
            }
          });
        }
      },
      onError: (err, req, res) => {
        logger.error(`Proxy error from ${serviceName}`, {
          service: serviceName,
          error: err.message,
          code: err.code,
          target: targetUrl,
          method: req.method,
          url: req.originalUrl,
          stack: err.stack
        });
        
        // Update service health status
        const service = serviceRegistry.getService(serviceName.toLowerCase());
        if (service) {
          serviceRegistry.services.set(serviceName.toLowerCase(), {
            ...service,
            healthy: false,
            lastError: err.message,
            lastCheck: new Date()
          });
        }
        
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            error: 'Service temporarily unavailable',
            service: serviceName,
            code: 'SERVICE_PROXY_ERROR',
            message: err.code === 'ECONNREFUSED' ? 'Service is down' : err.message,
            timestamp: new Date().toISOString(),
            retryAfter: 30
          });
        }
      }
    });

    // Use the proxy middleware
    proxy(req, res, next);
  };
}

export default createServiceProxy;