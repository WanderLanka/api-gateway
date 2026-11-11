import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import express from 'express';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'automated-test-secret-with-at-least-32-characters';
const { authenticateToken, optionalAuth } = await import('../middleware/auth.js');
const { default: createServiceProxy } = await import('../proxy/createServiceProxy.js');
const { default: registry } = await import('../utils/serviceRegistry.js');
const { services } = await import('../config/index.js');

async function serve(t, app) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return `http://127.0.0.1:${server.address().port}`;
}

const payload = { userId: '507f1f77bcf86cd799439011', username: 'test-user', role: 'traveller' };
const access = jwt.sign(payload, process.env.JWT_SECRET);

test('booking debug path cannot bypass authentication; refresh and expired tokens are rejected', async t => {
  const app = express();
  app.use(authenticateToken, (req, res) => res.json(req.user));
  const base = await serve(t, app);
  for (const path of ['/addBooking', '/tourpackage_booking/list']) {
    assert.equal((await fetch(base + path)).status, 401);
  }
  for (const token of ['bad', jwt.sign({ ...payload, type: 'refresh' }, process.env.JWT_SECRET), jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: -1 })]) {
    assert.equal((await fetch(base + '/private', { headers: { Authorization: `Bearer ${token}` } })).status, 403);
  }
  const response = await fetch(base + '/private', { headers: { Authorization: `Bearer ${access}` } });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).userId, payload.userId);
});

test('optional auth attaches valid access identity and ignores invalid or refresh tokens', async t => {
  const app = express();
  app.use(optionalAuth, (req, res) => res.json({ userId: req.user?.userId || null }));
  const base = await serve(t, app);
  for (const token of ['bad', jwt.sign({ ...payload, type: 'refresh' }, process.env.JWT_SECRET)]) {
    assert.equal((await (await fetch(base, { headers: { Authorization: `Bearer ${token}` } })).json()).userId, null);
  }
  assert.equal((await (await fetch(base, { headers: { Authorization: `Bearer ${access}` } })).json()).userId, payload.userId);
});

test('actual router preserves paths, queries, raw JSON, multipart and auth across all service mounts', async t => {
  const upstream = express();
  upstream.use(express.raw({ type: () => true }));
  upstream.use((req, res) => res.json({ path: req.originalUrl, body: req.body?.toString(), auth: req.headers.authorization, internal: req.headers['x-internal-token'] || null, contentType: req.headers['content-type'] }));
  const target = await serve(t, upstream);
  for (const cfg of Object.values(services)) cfg.url = target;
  const { default: router } = await import('../routes/proxyRoutes.js');
  const app = express();
  app.use('/api', router);
  const base = await serve(t, app);
  const cases = [
    ['auth/refresh?probe=1', '/refresh?probe=1'], ['booking/enhanced', '/enhanced'],
    ['bookings/enhanced', '/enhanced'], ['payment/payments', '/payments'],
    ['transport/vehicles/all', '/vehicles/all'], ['accommodation/accommodations', '/accommodations'],
    ['guide/guide/list', '/guide/list'], ['community/posts', '/posts'],
    ['listing/guides', '/guides'], ['itinerary/places/search?q=Ella', '/places/search?q=Ella'],
    ['routes/calculate/123', '/routes/calculate/123'], ['my-trips/summary', '/my-trips/summary']
  ];
  for (const [path, expected] of cases) {
    const response = await fetch(`${base}/api/${path}`, { method: 'POST', headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json', 'x-internal-token': 'must-not-forward' }, body: '{"hello":"world"}' });
    assert.equal(response.status, 200, path);
    const data = await response.json();
    assert.equal(data.path, expected, path);
    assert.equal(data.body, '{"hello":"world"}', path);
    assert.equal(data.auth, `Bearer ${access}`);
    assert.equal(data.internal, null);
  }
  const multipart = '--test-boundary\r\nContent-Disposition: form-data; name="title"\r\n\r\nElla\r\n--test-boundary--\r\n';
  const upload = await fetch(`${base}/api/community/posts`, { method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=test-boundary' }, body: multipart });
  assert.equal((await upload.json()).body, multipart);
});

test('upstream connection failure returns structured 503; unhealthy registry rejects request', async t => {
  const app = express();
  app.use('/proxy', createServiceProxy('AUTH', 'http://127.0.0.1:1'));
  const base = await serve(t, app);
  const failed = await fetch(base + '/proxy/test');
  assert.equal(failed.status, 503);
  assert.equal((await failed.json()).code, 'SERVICE_PROXY_ERROR');
  const service = registry.getService('AUTH');
  const before = service.healthy;
  service.healthy = false;
  t.after(() => { service.healthy = before; });
  const unhealthy = await fetch(base + '/proxy/test');
  assert.equal(unhealthy.status, 503);
  assert.equal((await unhealthy.json()).code, 'SERVICE_UNHEALTHY');
});
