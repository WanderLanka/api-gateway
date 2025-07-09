const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Proxy routes
app.use('/auth', createProxyMiddleware({ target: 'http://localhost:3001', changeOrigin: true }));
app.use('/transport', createProxyMiddleware({ target: 'http://localhost:3002', changeOrigin: true }));
app.use('/accommodation', createProxyMiddleware({ target: 'http://localhost:3003', changeOrigin: true }));
app.use('/itinerary', createProxyMiddleware({ target: 'http://localhost:3004', changeOrigin: true  }));
app.use('/guide', createProxyMiddleware({ target: 'http://localhost:3005', changeOrigin: true }));
app.use('/payment', createProxyMiddleware({ target: 'http://localhost:3006', changeOrigin: true }));
app.use('/boooking',createProxyMiddleware({target:'http://localhost:3009',changeOrigin:true}));

app.listen(3000, () => {
  console.log('🛡️ API Gateway running on http://localhost:3000');
});
