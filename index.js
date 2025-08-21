const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Enable trust proxy for better networking
app.set('trust proxy', true);

// CORS for both web and mobile apps
app.use(cors({ 
  origin: [
    'http://localhost:5173',           // Web app
    'http://192.168.8.159:8081',       // Mobile app (Expo) - CURRENT IP
    'exp://192.168.8.159:8081',        // Mobile app (Expo protocol) - CURRENT IP
    'http://10.21.136.103:8081',       // Previous IP (fallback)
    'exp://10.21.136.103:8081',        // Previous IP (fallback)
    'http://172.20.10.2:8081',         // Previous IP (fallback)
    'exp://172.20.10.2:8081'           // Previous IP (fallback)
  ], 
  credentials: true 
}));

// Health check before other middlewares
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    services: {
      auth: 'http://localhost:3001',
      transport: 'http://localhost:3002',
      accommodation: 'http://localhost:3003',
      itinerary: 'http://localhost:3004',
      guide: 'http://localhost:3005',
      payment: 'http://localhost:3006',
      booking: 'http://localhost:3009'
    }
  });
});

// Logging middleware to see what requests are coming in
app.use((req, res, next) => {
  console.log(`\n🚀 ===== NEW REQUEST =====`);
  console.log(`📥 Incoming request: ${req.method} ${req.originalUrl}`);
  console.log(`📥 From: ${req.get('host')} | User-Agent: ${req.get('user-agent')}`);
  console.log(`📥 Headers:`, {
    'content-type': req.get('content-type'),
    'authorization': req.get('authorization') ? 'Bearer ***' : 'None',
    'origin': req.get('origin')
  });
  
  // Log request body for POST/PUT requests
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📤 Request Body:`, req.body);
  }
  
  next();
});

// Service proxy with detailed request tracing
const createServiceProxy = (serviceName, target) => {
  console.log(`📡 Creating proxy for ${serviceName} → ${target}`);
  
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    secure: false,
    timeout: 30000,
    onProxyReq: (proxyReq, req, res) => {
      console.log(`\n🔗 ===== ROUTING TO ${serviceName} =====`);
      console.log(`🎯 Target Service: ${serviceName}`);
      console.log(`🌐 Target URL: ${target}${req.url}`);
      console.log(`📤 Method: ${req.method}`);
      console.log(`📤 Original URL: ${req.originalUrl}`);
      console.log(`📤 Proxy URL: ${req.url}`);
      
      // Handle body for POST requests
      if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        console.log(`📤 Forwarding Body to ${serviceName}:`, req.body);
      }
      
      console.log(`🚀 Request forwarded to ${serviceName} service...`);
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`\n✅ ===== RESPONSE FROM ${serviceName} =====`);
      console.log(`📡 Status: ${proxyRes.statusCode}`);
      console.log(`📡 Status Message: ${proxyRes.statusMessage}`);
      console.log(`📡 Response Headers:`, proxyRes.headers);
      console.log(`🎯 Service: ${serviceName} successfully processed ${req.method} ${req.originalUrl}`);
      
      // Log response body for debugging (first 500 characters)
      let body = '';
      proxyRes.on('data', chunk => {
        body += chunk;
      });
      proxyRes.on('end', () => {
        if (body) {
          const truncatedBody = body.length > 500 ? body.substring(0, 500) + '...' : body;
          console.log(`📥 Response Body from ${serviceName}:`, truncatedBody);
        }
      });
    },
    onError: (err, req, res) => {
      console.error(`\n❌ ===== ERROR FROM ${serviceName} =====`);
      console.error(`❌ Service: ${serviceName}`);
      console.error(`❌ Error: ${err.message}`);
      console.error(`❌ Code: ${err.code}`);
      console.error(`❌ Target: ${target}`);
      console.error(`❌ Request: ${req.method} ${req.originalUrl}`);
      
      if (!res.headersSent) {
        res.status(503).json({ 
          success: false,
          error: 'Service temporarily unavailable',
          service: serviceName,
          message: err.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  });
};

// Proxy routes
app.use('/auth', createServiceProxy('AUTH', 'http://localhost:3001'));
app.use('/transport', createServiceProxy('TRANSPORT', 'http://localhost:3002'));
app.use('/accommodation', createServiceProxy('ACCOMMODATION', 'http://localhost:3003'));
app.use('/itinerary', createServiceProxy('ITINERARY', 'http://localhost:3004'));
app.use('/guide', createServiceProxy('GUIDE', 'http://localhost:3005'));
app.use('/payment', createServiceProxy('PAYMENT', 'http://localhost:3006'));
app.use('/booking', createServiceProxy('BOOKING', 'http://localhost:3009')); // Fixed typo

app.listen(3000, '0.0.0.0', () => {
  console.log('🛡️ API Gateway running on http://localhost:3000');
  console.log('🌐 Also accessible on http://192.168.8.159:3000');
  console.log('📱 Supporting both web and mobile apps');
  console.log('🌐 Web app: http://localhost:5173');
  console.log('📱 Mobile app: http://192.168.8.159:8081');
});
