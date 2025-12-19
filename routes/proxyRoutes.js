// routes/proxyRoutes.js
import express from 'express';
import logger from '../utils/logger.js';
import createServiceProxy from '../proxy/createServiceProxy.js';
import { services } from '../config/index.js';
import { authLimiter, strictLimiter, authenticateToken, optionalAuth } from '../middleware/index.js';

const router = express.Router();

// Auth service routes (with stricter rate limiting), but allow a little more for refresh
router.use('/auth/refresh', createServiceProxy('AUTH', services.auth.url));
// Add debugging middleware
router.use((req, res, next) => {
  logger.info(`🔍 ProxyRoutes: ${req.method} ${req.originalUrl} → baseUrl: ${req.baseUrl}, path: ${req.path}`);
  next();
});

// Auth service routes (with rate limiting)
// This includes all auth and profile routes: /auth/*, /profile/*
router.use('/auth', authLimiter, createServiceProxy('AUTH', services.auth.url));

// Protected routes (require authentication)
// Allow public/semi-protected access for specific read-only booking endpoints first
// List tour package bookings (reads only); downstream service still enforces filtering
router.use('/booking/tourpackage_booking/list', optionalAuth, createServiceProxy('BOOKING', services.booking.url));

// All other booking routes require authentication
router.use('/booking', authenticateToken, createServiceProxy('BOOKING', services.booking.url));
router.use('/bookings', authenticateToken, createServiceProxy('BOOKING', services.booking.url));
router.use('/payment', authenticateToken, strictLimiter, createServiceProxy('PAYMENT', services.payment.url));

// Semi-protected routes (optional authentication)
router.use('/transport', optionalAuth, createServiceProxy('TRANSPORT', services.transport.url));
router.use('/accommodation', optionalAuth, createServiceProxy('ACCOMMODATION', services.accommodation.url));
router.use('/guide', optionalAuth, createServiceProxy('GUIDE', services.guide.url));
// Listing service routes (for tour guide listings, packages, etc.)
router.use('/listing', optionalAuth, createServiceProxy('LISTING', services.listing.url));
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
export default router;

