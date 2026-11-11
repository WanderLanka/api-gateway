import registry from './utils/serviceRegistry.js';
// server.js
import express from 'express';
import helmet from 'helmet';
import logger from './utils/logger.js';
import { server, cors } from './config/index.js';
import { errorHandler, notFoundHandler, generalLimiter, corsMiddleware, requestLogger } from './middleware/index.js';
import healthRoutes from './routes/health.js';
import proxyRoutes from './routes/proxyRoutes.js';

const app = express();
app.get('/ready', (req, res) => {
  const services = Object.values(registry.getAllServices());
  const ready = services.every(service => service.lastCheck && service.healthy);
  res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'not_ready' });
});

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// Trust proxy for accurate IP addresses
app.set('trust proxy', process.env.TRUST_PROXY ? Number(process.env.TRUST_PROXY) : false);

// CORS middleware
app.use(corsMiddleware);

// Rate limiting (general)
app.use(generalLimiter);

// Request logging middleware
app.use(requestLogger);

// Welcome route (with JSON parsing only for this route)
app.get('/', express.json(), (req, res) => {
  res.json({
    success: true,
    message: 'WanderLanka API Gateway',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      healthDetailed: '/health/detailed',
      api: '/api/*'
    },
    services: ['auth', 'transport', 'accommodation', 'itinerary', 'guide', 'payment', 'booking']
  });
});

// Routes (apply JSON parsing only to gateway's own routes)
app.use('/health', express.json(), healthRoutes);
app.use('/api', proxyRoutes); // NO JSON parsing - let proxy handle it

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
