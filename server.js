import app from './app.js';
import { server } from './config/index.js';
import registry from './utils/serviceRegistry.js';

if (server.env === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET must contain at least 32 characters in production');
}
const httpServer = app.listen(server.port, server.host);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    clearInterval(registry.timer);
    const deadline = setTimeout(() => process.exit(1), 10000).unref();
    httpServer.close(() => { clearTimeout(deadline); process.exit(0); });
  });
}
