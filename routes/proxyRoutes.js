// routes/proxyRoutes.js
import express from 'express';
import createServiceProxy from '../proxy/createServiceProxy.js';
import { services } from '../config/index.js';
import { authLimiter, strictLimiter, authenticateToken, optionalAuth } from '../middleware/index.js';

const router = express.Router();

// Auth service routes (with rate limiting)
router.use('/auth', authLimiter, createServiceProxy('AUTH', services.auth.url));

// Protected routes (require authentication)
router.use('/booking', authenticateToken, createServiceProxy('BOOKING', services.booking.url));
router.use('/bookings', authenticateToken, createServiceProxy('BOOKING', services.booking.url));
router.use('/bookings/userBookings', authenticateToken, createServiceProxy('BOOKING', services.booking.url));
router.use('/payment', authenticateToken, strictLimiter, createServiceProxy('PAYMENT', services.payment.url));

// Semi-protected routes (optional authentication)
router.use('/transport', optionalAuth, createServiceProxy('TRANSPORT', services.transport.url));
router.use('/accommodation', optionalAuth, createServiceProxy('ACCOMMODATION', services.accommodation.url));
router.use('/guide', optionalAuth, createServiceProxy('GUIDE', services.guide.url));

// Public routes
router.use('/itinerary', createServiceProxy('ITINERARY', services.itinerary.url));
// Listing routes (mostly public; may use optional auth for personalization lat// Itinerary service routes (optional auth for place search, required for CRUD operations)
router.use('/itinerary', optionalAuth, createServiceProxy('ITINERARY', services.itinerary.url));

// Route calculation routes (part of itinerary service, let itinerary service handle auth)
router.use('/routes', optionalAuth, createServiceProxy('ITINERARY', services.itinerary.url));

// Public routes
export default router;

