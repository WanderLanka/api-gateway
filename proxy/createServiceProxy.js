import { createProxyMiddleware } from 'http-proxy-middleware';
import logger from '../utils/logger.js';
import serviceRegistry from '../utils/serviceRegistry.js';

export default function createServiceProxy(serviceName, targetUrl) {
  const proxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    timeout: 300000,
    proxyTimeout: 300000,
    // Express already removed the mount prefix; itinerary aliases restore theirs.
    on: {
      error(err, req, res) {
        logger.error('Service proxy failed', { service: serviceName, code: err.code });
        if (!res.headersSent) {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Service unavailable', service: serviceName, code: 'SERVICE_PROXY_ERROR' }));
        }
      }
    }
  });
  return (req, res, next) => {
    // Internal credentials are accepted only on the private service network.
    delete req.headers['x-internal-token'];
    if (!serviceRegistry.isServiceHealthy(serviceName)) {
      return res.status(503).json({ success: false, error: 'Service unavailable', service: serviceName, code: 'SERVICE_UNHEALTHY' });
    }
    return proxy(req, res, next);
  };
}
