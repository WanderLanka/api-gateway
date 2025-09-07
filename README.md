# API Gateway - WanderLanka

Enterprise-grade API Gateway for WanderLanka microservices architecture.

## Features

- 🛡️ **Security**: JWT authentication, rate limiting, CORS, Helmet security headers
- 📊 **Monitoring**: Health checks, service registry, structured logging
- 🔄 **Load Balancing**: Service discovery and health monitoring
- 🚦 **Rate Limiting**: Configurable rate limits per endpoint
- 📝 **Logging**: Winston-based structured logging
- ⚡ **Performance**: Optimized proxy middleware with timeout handling

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Client  │    │   Admin Panel   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │   (Port 3000)   │
                    └─────────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
    ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
    │ Auth Service  │    │Transport Svc  │    │Booking Service│
    │  (Port 3001)  │    │  (Port 3002)  │    │  (Port 3009)  │
    └───────────────┘    └───────────────┘    └───────────────┘
```

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the gateway**
   ```bash
   npm start          # Production
   npm run dev        # Development with nodemon
   ```

## Configuration

### Environment Variables

Copy the example environment file and customize it for your setup:

```bash
cp .env.example .env
```

Then edit the `.env` file with your configuration. The `.env.example` file contains all available configuration options with default values:

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
LOG_LEVEL=info

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
TRANSPORT_SERVICE_URL=http://localhost:3002
ACCOMMODATION_SERVICE_URL=http://localhost:3003
ITINERARY_SERVICE_URL=http://localhost:3004
GUIDE_SERVICE_URL=http://localhost:3005
PAYMENT_SERVICE_URL=http://localhost:3006
BOOKING_SERVICE_URL=http://localhost:3009

# Security
JWT_SECRET=your-jwt-secret-change-in-production
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# CORS Origins
WEB_APP_URL=http://localhost:5173
MOBILE_APP_URL_1=http://192.168.8.159:8081
```

## API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with service status
- `GET /health/services` - Services health summary

### Service Routes
- `/api/auth/*` - Authentication service (rate limited)
- `/api/transport/*` - Transport service (optional auth)
- `/api/accommodation/*` - Accommodation service (optional auth)
- `/api/itinerary/*` - Itinerary service (public)
- `/api/guide/*` - Guide service (optional auth)
- `/api/payment/*` - Payment service (authenticated, strict rate limit)
- `/api/booking/*` - Booking service (authenticated)

## Security Features

### Authentication
- JWT token validation
- Optional authentication for some routes
- Token-based user context

### Rate Limiting
- General rate limiting: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- Payment endpoints: 10 requests per 15 minutes

### CORS
Configured for multiple origins including web and mobile apps.

## Monitoring

### Health Checks
The gateway performs health checks on all services every 30 seconds.

### Logging
Structured logging with Winston:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output in development

### Service Registry
Automatic service discovery and health monitoring with:
- Service status tracking
- Consecutive failure counting
- Automatic recovery detection

## Folder Structure

```
api-gateway/
├── config/
│   └── index.js             # Application configuration
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── cors.js              # CORS configuration
│   ├── errorHandler.js      # Error handling
│   ├── logger.js            # Request logging
│   └── rateLimiter.js       # Rate limiting
├── proxy/
│   └── createServiceProxy.js # Proxy middleware
├── routes/
│   ├── health.js            # Health check routes
│   └── proxyRoutes.js       # Service proxy routes
├── utils/
│   ├── logger.js            # Winston logger setup
│   └── serviceRegistry.js   # Service discovery
├── logs/                    # Log files
├── .env                     # Environment variables
├── index.js                 # Application entry point
├── server.js                # Express app setup
└── package.json
```

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start with nodemon for development
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run lint:fix` - Fix linting issues

### Adding New Services
1. Add service URL to `.env`
2. Update `config/index.js`
3. Add route in `routes/proxyRoutes.js`
4. Configure authentication/rate limiting as needed

## Error Handling

Comprehensive error handling with:
- Service timeout handling
- Connection failure recovery
- Structured error responses
- Error logging and monitoring

## Best Practices Implemented

✅ **Security**: JWT auth, rate limiting, CORS, security headers  
✅ **Monitoring**: Health checks, service registry, structured logging  
✅ **Performance**: Connection pooling, timeout handling, caching headers  
✅ **Reliability**: Error handling, graceful degradation, circuit breaking  
✅ **Maintainability**: Modular structure, configuration management  
✅ **Scalability**: Horizontal scaling ready, load balancer friendly  

## License

ISC License - see LICENSE file for details.
