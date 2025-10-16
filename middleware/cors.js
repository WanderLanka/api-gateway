// middleware/cors.js
import cors from 'cors';
import { cors as corsConfig } from '../config/index.js';

export default cors({
  origin: corsConfig.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Type', 'x-platform']
});
