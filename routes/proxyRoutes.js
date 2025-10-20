import { authLimiter, authenticateToken, optionalAuth, strictLimiter } from '../middleware/index.js';

import createServiceProxy from '../proxy/createServiceProxy.js';
// routes/proxyRoutes.js
import express from 'express';
import logger from '../utils/logger.js';
import { services } from '../config/index.js';

const router = express.Router();

// Add debugging middleware
router.use((req, res, next) => {
  logger.info(`🔍 ProxyRoutes: ${req.method} ${req.originalUrl} → baseUrl: ${req.baseUrl}, path: ${req.path}`);
  next();
});

// Auth service routes (with rate limiting)
// This includes all auth and profile routes: /auth/*, /profile/*
router.use('/auth', authLimiter, createServiceProxy('AUTH', services.auth.url));

// Protected routes (require authentication)
router.use('/booking', authenticateToken, createServiceProxy('BOOKING', services.booking.url));
router.use('/payment', authenticateToken, strictLimiter, createServiceProxy('PAYMENT', services.payment.url));

// Semi-protected routes (optional authentication)
router.use('/transport', optionalAuth, createServiceProxy('TRANSPORT', services.transport.url));
router.use('/accommodation', optionalAuth, createServiceProxy('ACCOMMODATION', services.accommodation.url));
router.use('/guide', optionalAuth, createServiceProxy('GUIDE', services.guide.url));

// Community service routes (optional auth for viewing, required for posting)
router.use('/community', optionalAuth, createServiceProxy('COMMUNITY', services.community.url));

// Route calculation routes (part of itinerary service, let itinerary service handle auth)
// MUST be defined BEFORE /itinerary to avoid path conflicts
router.use('/routes', optionalAuth, (req, res, next) => {
  req.url = '/routes' + req.url;
  next();
}, createServiceProxy('ITINERARY', services.itinerary.url));

// Itinerary service routes (optional auth for place search, required for CRUD operations)
router.use('/itinerary', optionalAuth, createServiceProxy('ITINERARY', services.itinerary.url));

// My Trips routes (requires authentication, part of itinerary service)
// Using optionalAuth since the itinerary service handles authentication internally
// Need to restore /my-trips prefix that Express strips
router.use('/my-trips', optionalAuth, (req, res, next) => {
  req.url = '/my-trips' + req.url;
  next();
}, createServiceProxy('ITINERARY', services.itinerary.url));

// Public routes
// Listing routes (mostly public; may use optional auth for personalization later)
router.use('/listing', optionalAuth, createServiceProxy('LISTING', services.listing.url));

export default router;

