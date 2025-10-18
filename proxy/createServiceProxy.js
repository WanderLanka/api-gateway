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
    // Express router already stripped /api/{service}, so path should be ready to forward
    pathRewrite: (path, req) => {
      console.log(`🔍 [PROXY DEBUG] Received path after router: "${path}" for service: "${serviceName}"`);
      console.log(`🔍 [PROXY DEBUG] Forwarding path unchanged: "${path}"`);
      
      // Path is already clean after Express router stripping, forward as-is
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
