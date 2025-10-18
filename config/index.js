import 'dotenv/config';

export const server = {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
};

export const services = {
    auth: {
        url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        timeout: 5000,
        retries: 3
    },
    transport: {
        url: process.env.TRANSPORT_SERVICE_URL || 'http://localhost:3002',
        timeout: 5000,
        retries: 3
    },
    accommodation: {
        url: process.env.ACCOMMODATION_SERVICE_URL || 'http://localhost:3003',
        timeout: 5000,
        retries: 3
    },
    itinerary: {
        url: process.env.ITINERARY_SERVICE_URL || 'http://localhost:3008',
        timeout: 5000,
        retries: 3
    },
    guide: {
        url: process.env.GUIDE_SERVICE_URL || 'http://localhost:3005',
        timeout: 5000,
        retries: 3
    },
    payment: {
        url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
        timeout: 5000,
        retries: 3
    },
    booking: {
        url: process.env.BOOKING_SERVICE_URL || 'http://localhost:3009',
        timeout: 5000,
        retries: 3
    },
    listing: {
        url: process.env.LISTING_SERVICE_URL || 'http://localhost:3010',
        timeout: 5000,
        retries: 3
    },
    community: {
        url: process.env.COMMUNITY_SERVICE_URL || 'http://localhost:3007',
        timeout: 10000, // Longer timeout for image uploads
        retries: 2
    }
};

export const cors = {
    origins: [
        process.env.WEB_APP_URL || 'http://localhost:5173',
        process.env.MOBILE_APP_URL_1 || 'http://192.168.8.159:8081',
        `exp://${process.env.MOBILE_APP_URL_1?.replace('http://', '') || '192.168.8.159:8081'}`,
        process.env.MOBILE_APP_URL_2 || 'http://10.21.136.103:8081',
        `exp://${process.env.MOBILE_APP_URL_2?.replace('http://', '') || '10.21.136.103:8081'}`,
        process.env.MOBILE_APP_URL_3 || 'http://172.20.10.2:8081',
        `exp://${process.env.MOBILE_APP_URL_3?.replace('http://', '') || '172.20.10.2:8081'}`
    ]
};

export const security = {
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100
    }
};

export const logging = {
    level: process.env.LOG_LEVEL || 'info'
};
