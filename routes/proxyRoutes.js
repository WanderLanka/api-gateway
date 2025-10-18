import { authLimiter, authenticateToken, optionalAuth, strictLimiter } from '../middleware/index.js';

import createServiceProxy from '../proxy/createServiceProxy.js';
// routes/proxyRoutes.js
import express from 'express';
import { services } from '../config/index.js';

const router = express.Router();

// Auth service routes (with stricter rate limiting)
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

// Itinerary service routes (optional auth for place search, required for CRUD operations)
router.use('/itinerary', optionalAuth, createServiceProxy('ITINERARY', services.itinerary.url));

// Route calculation routes (part of itinerary service, let itinerary service handle auth)
router.use('/routes', optionalAuth, createServiceProxy('ITINERARY', services.itinerary.url));

// Public routes
// Listing routes (mostly public; may use optional auth for personalization later)
router.use('/listing', optionalAuth, createServiceProxy('LISTING', services.listing.url));

export default router;
