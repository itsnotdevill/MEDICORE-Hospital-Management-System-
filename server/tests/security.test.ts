import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('Security Headers and Middleware', () => {
  it('includes essential Helmet security headers', async () => {
    const res = await request(app).get('/api/health');

    // Helmet security headers
    expect(res.headers).toHaveProperty('x-dns-prefetch-control');
    expect(res.headers).toHaveProperty('x-frame-options');
    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
  });

  it('rejects unauthenticated requests to protected endpoints with 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toMatch(/Authentication required|jwt/i);
  });

  it('validates auth login request body with 400 when missing email/password', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message', 'Validation failed');
  });
});
