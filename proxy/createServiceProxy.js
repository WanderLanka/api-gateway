import { createProxyMiddleware } from 'http-proxy-middleware';
import logger from '../utils/logger.js';
import serviceRegistry from '../utils/serviceRegistry.js';

function createServiceProxy(serviceName, targetUrl) {
  logger.info(`🛠 Proxy for ${serviceName} → ${targetUrl}`);

  // Create the proxy middleware once
  const proxyMiddleware = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    secure: false,
    timeout: 300000, // 5 minutes for large file uploads
    proxyTimeout: 300000, // 5 minutes
    logLevel: 'debug',
    // Ensure correct stripping of the service prefix. Use originalUrl to avoid double-stripping
    // when routers are nested (e.g., app.use('/api', router) and router.use('/guide', ...)).
    pathRewrite: (path, req) => {
      const lower = serviceName.toLowerCase();
      const originalPath = req.originalUrl || path;
      const apiPrefix = `/api/${lower}`;

      // If coming via /api/<service>/..., strip that prefix from originalUrl
      if (originalPath.startsWith(apiPrefix)) {
        const rewritten = originalPath.slice(apiPrefix.length) || '/';
        return rewritten;
      }

      // Otherwise, if directly mounted at /<service>, strip that from the current path
      const directPrefix = `/${lower}`;
      if (path.startsWith(directPrefix)) {
        const rewritten = path.slice(directPrefix.length) || '/';
        return rewritten;
      }
      return path;
    },
    onProxyReq: (proxyReq, req) => {
      logger.info(`📤 Forwarding ${req.method} ${req.originalUrl} → ${serviceName} (sent path: ${proxyReq.path})`);
      logger.info(`📤 Request details:`, {
        originalUrl: req.originalUrl,
        targetUrl: targetUrl + proxyReq.path,
        headers: {
          authorization: req.headers.authorization ? 'Present' : 'Missing',
          'content-type': req.headers['content-type'],
          'x-platform': req.headers['x-platform']
        },
        user: req.user ? req.user.userId : 'No user attached'
      });
    },
    onProxyRes: (proxyRes, req) => {
      logger.info(`📥 Response ${proxyRes.statusCode} from ${serviceName} for ${req.method} ${req.originalUrl}`);
      if (proxyRes.statusCode >= 400) {
        logger.error(`❌ Error response from ${serviceName}:`, {
          status: proxyRes.statusCode,
          statusText: proxyRes.statusMessage,
          url: req.originalUrl
        });
      }
    },
    onError: (err, req, res) => {
      logger.error(`❌ Proxy error for ${serviceName}: ${err.message}`);
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          error: 'Service unavailable',
          service: serviceName,
          code: 'SERVICE_PROXY_ERROR',
          message: err.code === 'ECONNREFUSED' ? '🚫 Service is down' : err.message
        });
      }
    }
  });

  // Return the actual request handler
  return (req, res, next) => {
    if (!serviceRegistry.isServiceHealthy(serviceName)) {
      logger.warn(`⚠️ ${serviceName} is unhealthy. Request rejected.`);
      return res.status(503).json({
        success: false,
        error: 'Service unavailable',
        service: serviceName,
        code: 'SERVICE_UNHEALTHY'
      });
    }

    logger.info(`✅ ${serviceName} healthy. Forwarding request ${req.method} ${req.originalUrl}`);
    
    // Call the single proxy middleware
    proxyMiddleware(req, res, next);
  };
}

export default createServiceProxy;
