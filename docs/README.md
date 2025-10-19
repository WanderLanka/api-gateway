# 🌐 WanderLanka API Gateway

## Overview

The WanderLanka API Gateway serves as the central entry point for all client requests in the microservices architecture. It handles routing, authentication, rate limiting, CORS, and service proxying to ensure secure and efficient communication between clients and backend services.

## 🏗️ Architecture

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Clients   │───▶│   API Gateway   │───▶│   Microservices │
│             │    │   (Port 3000)   │    │                 │
│ • Web App   │    │                 │    │ • Auth Service  │
│ • Mobile    │    │ • Routing       │    │ • Transport     │
│ • APIs      │    │ • Auth          │    │ • Accommodation │
│             │    │ • Rate Limiting │    │ • Booking       │
│             │    │ • CORS          │    │ • Payment       │
│             │    │ • Logging       │    │ • Itinerary     │
└─────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Request Flow

### 1. Complete Request Journey

```
Client Request → Middleware Processing → Service Routing → Target Service → Response
```

#### Example: User Login Flow
```
1. Mobile App: POST http://192.168.8.142:3000/api/auth/login
2. API Gateway: Apply middleware (CORS, Rate Limiting)
3. Proxy Service: Rewrite path (/api/auth/login → /login)
4. User Service: Process at http://localhost:3001/login
5. Response: Return authentication tokens through gateway
```

## 🚦 Routing Configuration

### Service Routes (`routes/proxyRoutes.js`)

| Route Pattern | Target Service | Port | Protection Level | Middleware |
|---------------|----------------|------|------------------|------------|
| `/api/auth/*` | User Service | 3001 | Rate Limited | `authLimiter` |
| `/api/booking/*` | Booking Service | 3009 | Protected | `authenticateToken` |
| `/api/payment/*` | Payment Service | 3006 | Strict Protected | `authenticateToken` + `strictLimiter` |
| `/api/transport/*` | Transport Service | 3002 | Semi-Protected | `optionalAuth` |
| `/api/accommodation/*` | Accommodation Service | 3003 | Semi-Protected | `optionalAuth` |
| `/api/guide/*` | Guide Service | 3005 | Semi-Protected | `optionalAuth` |
| `/api/itinerary/*` | Itinerary Service | 3004 | Public | None |
| `/api/listing/*` | Listing Service | 3010 | Semi-Protected | `optionalAuth` |

### Protection Levels Explained

#### 🔒 **Protected Routes** (Require Authentication)
- **Booking Service**: User must be logged in
- **Payment Service**: User must be logged in + strict rate limiting

#### 🔓 **Semi-Protected Routes** (Optional Authentication)
- **Transport/Accommodation/Guide**: Enhanced features for logged-in users
- **Listing**: Personalized content for authenticated users

#### 🌐 **Public Routes**
- **Itinerary**: Accessible without authentication
- **Auth**: Public for login/registration (but rate limited)

## 🔄 Path Rewriting System

### How URL Transformation Works

The proxy automatically rewrites incoming URLs to remove the service prefix:

```javascript
// Path Rewriting Logic
Input:  /api/auth/login     → Output: /login
Input:  /api/transport/vehicles → Output: /vehicles
Input:  /api/booking/create     → Output: /create
```

### Implementation
```javascript
pathRewrite: (path, req) => {
  const serviceName = 'AUTH'; // or TRANSPORT, etc.
  const lower = serviceName.toLowerCase();
  const prefixes = [`/api/${lower}`, `/${lower}`];
  
  for (const prefix of prefixes) {
    if (path.startsWith(prefix)) {
      return path.replace(prefix, '') || '/';
    }
  }
  return path;
}
```

## 🛡️ Security & Middleware

### Security Layers

1. **Helmet**: Security headers
2. **CORS**: Cross-origin request validation
3. **Rate Limiting**: Prevents API abuse
4. **Authentication**: JWT token verification
5. **Request Logging**: Complete audit trail

### Rate Limiting Configuration

```javascript
// General rate limiting
generalLimiter: 100 requests per 15 minutes

// Auth specific limiting  
authLimiter: 5 requests per 15 minutes

// Strict limiting (payments)
strictLimiter: 10 requests per 15 minutes
```

### CORS Configuration

```javascript
// Allowed origins
origins: [
  'http://localhost:5173',        // Web App (Vite dev server)
  'http://192.168.8.142:*'        // Mobile App (network access)
]

// Allowed headers
allowedHeaders: [
  'Content-Type',
  'Authorization', 
  'X-Client-Type',
  'x-platform'
]
```

## 🎯 Service Configuration

### Service Registry (`config/index.js`)

```javascript
export const services = {
  auth: {
    url: 'http://localhost:3001',
    timeout: 5000,
    retries: 3
  },
  transport: {
    url: 'http://localhost:3002',
    timeout: 5000,
    retries: 3
  },
  accommodation: {
    url: 'http://localhost:3003',
    timeout: 5000,
    retries: 3
  },
  // ... other services
};
```

### Environment Variables

```bash
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
TRANSPORT_SERVICE_URL=http://localhost:3002
ACCOMMODATION_SERVICE_URL=http://localhost:3003
BOOKING_SERVICE_URL=http://localhost:3009
PAYMENT_SERVICE_URL=http://localhost:3006
ITINERARY_SERVICE_URL=http://localhost:3004
GUIDE_SERVICE_URL=http://localhost:3005
LISTING_SERVICE_URL=http://localhost:3010
```

## 📱 Client Integration

### Web Application Requests

```javascript
// Web app configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Example: User login
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-platform': 'web'
  },
  body: JSON.stringify({ username, password })
});
```

### Mobile Application Requests

```javascript
// Mobile app configuration  
const API_BASE_URL = 'http://192.168.8.142:3000/api';

// Example: User registration
const response = await fetch(`${API_BASE_URL}/auth/register`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-platform': 'mobile'
  },
  body: JSON.stringify({ username, email, password, role })
});
```

## 🔧 Advanced Features

### Service Health Monitoring

```javascript
// Health check endpoints
GET /health                 // Gateway health
GET /health/detailed        // All services health
GET /api/auth/health       // Specific service health
```

### Request/Response Logging

All requests are automatically logged with:
- Timestamp
- Method and URL
- Source IP
- User Agent
- Response status
- Processing time

### Error Handling

```javascript
// Automatic error responses
{
  "success": false,
  "error": "Service unavailable",
  "service": "AUTH",
  "code": "SERVICE_PROXY_ERROR",
  "message": "🚫 Service is down"
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- All microservices running on their designated ports

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start the gateway
npm start
```

### Development Mode

```bash
# Start with auto-reload
npm run dev
```

## 📊 Monitoring & Debugging

### Log Levels

- **INFO**: Service startup, routing decisions
- **WARN**: Service health issues, retry attempts  
- **ERROR**: Proxy errors, service failures
- **DEBUG**: Detailed request/response information

### Health Check Endpoints

```bash
# Gateway status
curl http://localhost:3000/health

# Detailed service status
curl http://localhost:3000/health/detailed

# Specific service health
curl http://localhost:3000/api/auth/health
```

## 🔄 Service Integration Guide

### Adding a New Service

1. **Update Service Configuration**
```javascript
// config/index.js
export const services = {
  // ... existing services
  newService: {
    url: 'http://localhost:3011',
    timeout: 5000,
    retries: 3
  }
};
```

2. **Add Route Configuration**
```javascript
// routes/proxyRoutes.js
router.use('/newservice', optionalAuth, createServiceProxy('NEWSERVICE', services.newService.url));
```

3. **Update Environment Variables**
```bash
NEW_SERVICE_URL=http://localhost:3011
```

### Service Requirements

Each service must:
- Expose a `/health` endpoint
- Handle the rewritten paths correctly
- Return consistent JSON responses
- Implement proper error handling

## 🎯 Best Practices

### For Service Developers

1. **Always implement health checks**
```javascript
// Service health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
```

2. **Use consistent error responses**
```javascript
// Standard error format
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

3. **Handle platform detection**
```javascript
// Check platform header
const platform = req.headers['x-platform'] || 'web';
```

### For Client Developers

1. **Always include platform headers**
```javascript
headers: {
  'x-platform': 'web' // or 'mobile'
}
```

2. **Handle rate limiting gracefully**
```javascript
if (response.status === 429) {
  // Implement exponential backoff
}
```

3. **Use proper error handling**
```javascript
try {
  const response = await api.call();
} catch (error) {
  if (error.response?.data?.code === 'SERVICE_UNAVAILABLE') {
    // Service is down, show offline message
  }
}
```

## 📝 API Documentation

For detailed API documentation of each service, refer to:
- [Auth Service API](../user-service/docs/API.md)
- [Transport Service API](../transport-service/docs/API.md)
- [Accommodation Service API](../accommodation-service/docs/API.md)
- [Booking Service API](../booking-service/docs/API.md)
- [Payment Service API](../payment-service/docs/API.md)

## 🤝 Contributing

When contributing to the API Gateway:

1. **Follow the established routing patterns**
2. **Add appropriate middleware for new routes**
3. **Update service configuration**
4. **Add comprehensive logging**
5. **Test with all client types (web/mobile)**
6. **Update this documentation**

## 📞 Support

For questions or issues:
- Check service health endpoints
- Review gateway logs
- Verify service connectivity
- Ensure proper middleware configuration

---

*This documentation is part of the WanderLanka travel platform microservices architecture.*