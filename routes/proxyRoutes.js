// routes/proxyRoutes.js
import express from 'express';
import createServiceProxy from '../proxy/createServiceProxy.js';
import { services } from '../config/index.js';
import { authLimiter, strictLimiter, authenticateToken, optionalAuth } from '../middleware/index.js';

const router = express.Router();

// Auth service routes (with stricter rate limiting), but allow a little more for refresh
router.use('/auth/refresh', createServiceProxy('AUTH', services.auth.url));
router.use('/auth', authLimiter, createServiceProxy('AUTH', services.auth.url));

// Protected routes (require authentication)
// Allow public/semi-protected access for specific read-only booking endpoints first
// List tour package bookings (reads only); downstream service still enforces filtering
router.use('/booking/tourpackage_booking/list', optionalAuth, createServiceProxy('BOOKING', services.booking.url));

// All other booking routes require authentication
router.use('/booking', authenticateToken, createServiceProxy('BOOKING', services.booking.url));
router.use('/payment', authenticateToken, strictLimiter, createServiceProxy('PAYMENT', services.payment.url));

// Semi-protected routes (optional authentication)
router.use('/transport', optionalAuth, createServiceProxy('TRANSPORT', services.transport.url));
router.use('/accommodation', optionalAuth, createServiceProxy('ACCOMMODATION', services.accommodation.url));
router.use('/guide', optionalAuth, createServiceProxy('GUIDE', services.guide.url));

// Public routes
router.use('/itinerary', createServiceProxy('ITINERARY', services.itinerary.url));
// Listing routes (mostly public; may use optional auth for personalization later)
router.use('/listing', optionalAuth, createServiceProxy('LISTING', services.listing.url));

export default router;
