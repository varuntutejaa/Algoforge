const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');
const healthRoutes = require('../routes/publicHealth');

function buildApp() {
    const app = express();
    app.use(healthRoutes);
    return app;
}

test('GET /health responds with a well-formed payload', async () => {
    const app = buildApp();
    const res = await request(app).get('/health');

    assert.ok([200, 503].includes(res.status));
    assert.ok(['ok', 'degraded'].includes(res.body.status));
    assert.ok(['connected', 'disconnected'].includes(res.body.db));
    assert.equal(typeof res.body.version, 'string');
    assert.equal(typeof res.body.uptimeSeconds, 'number');
});

test('GET /health reports degraded when Mongo is not connected', async () => {
    // In this test process there is no live Mongo connection (readyState 0),
    // so the endpoint must fail safe with a 503 rather than claim health.
    const app = buildApp();
    const res = await request(app).get('/health');

    assert.equal(res.status, 503);
    assert.equal(res.body.status, 'degraded');
    assert.equal(res.body.db, 'disconnected');
});
