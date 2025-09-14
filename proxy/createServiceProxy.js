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
    timeout: 10000,
    logLevel: 'debug',
    // Ensure that when mounted under '/api', we remove either '/api/<service>' or '/<service>'
    pathRewrite: (path, req) => {
      const lower = serviceName.toLowerCase();
      const prefixes = [`/api/${lower}`, `/${lower}`];
      for (const p of prefixes) {
        if (path.startsWith(p)) {
          const rewritten = path.replace(p, '') || '/';
          return rewritten;
        }
      }
      return path;
    },
    onProxyReq: (proxyReq, req) => {
      logger.info(`📤Forwarding ${req.method} ${req.originalUrl} → ${serviceName} (sent path: ${proxyReq.path})`);
    },
    onProxyRes: (proxyRes) => {
      logger.info(`📥 Response ${proxyRes.statusCode} from ${serviceName}`);
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
