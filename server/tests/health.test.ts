import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('Health and System Endpoints', () => {
  it('GET /api/health returns 200 with status ok and timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/unknown-endpoint returns 404 route not found', async () => {
    const res = await request(app).get('/api/unknown-endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message', 'Route not found');
  });
});
