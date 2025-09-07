// server.js
import express from 'express';
import helmet from 'helmet';
import logger from './utils/logger.js';
import { server, cors } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import corsMiddleware from './middleware/cors.js';
import loggerMiddleware from './middleware/logger.js';
import healthRoutes from './routes/health.js';
import proxyRoutes from './routes/proxyRoutes.js';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// Trust proxy for accurate IP addresses
app.set('trust proxy', true);

// CORS middleware
app.use(corsMiddleware);

// Rate limiting (general)
app.use(generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(loggerMiddleware);

// Welcome route
app.get('/', (req, res) => {
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

// Routes
app.use('/health', healthRoutes);
app.use('/api', proxyRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
const PORT = server.port;
const HOST = server.host;

app.listen(PORT, HOST, () => {
  logger.info('API Gateway started successfully 🌐✅', {
    port: PORT,
    host: HOST,
    environment: server.env,
    webApp: cors.origins[0],
    mobileApp: cors.origins[1],
    endpoints: {
      web: `http://localhost:${PORT}`,
      network: `http://192.168.8.159:${PORT}`,
      health: `http://localhost:${PORT}/health`,
      healthDetailed: `http://localhost:${PORT}/health/detailed`
    }
  });
});

export default app;
