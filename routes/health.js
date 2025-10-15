// routes/health.js
import express from 'express';
import serviceRegistry from '../utils/serviceRegistry.js';

const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Detailed health check including services
router.get('/detailed', (req, res) => {
  const services = serviceRegistry.getAllServices();
  const healthyServices = Object.values(services).filter(service => service.healthy);
  const overallHealth = healthyServices.length === Object.keys(services).length;

  res.json({
    status: overallHealth ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: Object.fromEntries(
      Object.entries(services).map(([name, service]) => [
        name,
        {
          status: service.healthy ? 'healthy' : 'unhealthy',
          lastCheck: service.lastCheck,
          url: service.url,
          consecutiveFailures: service.consecutiveFailures || 0,
          ...(service.lastError && { lastError: service.lastError })
        }
      ])
    ),
    summary: {
      total: Object.keys(services).length,
      healthy: healthyServices.length,
      unhealthy: Object.keys(services).length - healthyServices.length
    }
  });
});

// Services health endpoint
router.get('/services', (req, res) => {
  const services = serviceRegistry.getAllServices();
  res.json({
    timestamp: new Date().toISOString(),
    services: Object.fromEntries(
      Object.entries(services).map(([name, service]) => [
        name,
        {
          status: service.healthy ? 'healthy' : 'unhealthy',
          url: service.url,
          lastCheck: service.lastCheck
        }
      ])
    )
  });
});

export default router;
