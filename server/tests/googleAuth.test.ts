import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import app from '../src/index';
import { User } from '../src/models/User';
import { AuditLog } from '../src/models/AuditLog';
import { config } from '../src/config/config';

// Mock google-auth-library
const mockVerifyIdToken = vi.fn();
const mockGetToken = vi.fn();
const mockGenerateAuthUrl = vi.fn();

vi.mock('google-auth-library', () => {
  return {
    OAuth2Client: vi.fn().mockImplementation(() => ({
      generateAuthUrl: mockGenerateAuthUrl.mockReturnValue(
        'https://accounts.google.com/o/oauth2/v2/auth?mock=true'
      ),
      getToken: mockGetToken,
      verifyIdToken: mockVerifyIdToken,
    })),
  };
});

describe('Google OAuth 2.0 / OpenID Connect & Staff Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuditLog, 'create').mockResolvedValue({} as any);
    config.googleClientId = 'test-client-id.apps.googleusercontent.com';
    config.googleClientSecret = 'test-client-secret';
  });

  it('GET /api/auth/google/config returns OAuth configuration status safely', async () => {
    const res = await request(app).get('/api/auth/google/config');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('enabled', true);
    expect(res.body.data).toHaveProperty('clientId', 'test-client-id.apps.googleusercontent.com');
    // Ensure client secret is never exposed
    expect(res.body.data).not.toHaveProperty('clientSecret');
  });

  it('GET /api/auth/google generates secure state cookie and redirects to Google', async () => {
    const res = await request(app).get('/api/auth/google');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('https://accounts.google.com');

    // Verify oauth_state cookie is set
    const cookies = res.headers['set-cookie'] || [];
    const stateCookie = cookies.find((c: string) => c.startsWith('oauth_state='));
    expect(stateCookie).toBeDefined();
    expect(stateCookie).toContain('HttpOnly');
    expect(stateCookie).toContain('SameSite=Lax');
  });

  it('GET /api/auth/google/callback rejects requests without code or state', async () => {
    const res = await request(app).get('/api/auth/google/callback');
    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oauth=invalid_request');
  });

  it('GET /api/auth/google/callback rejects state mismatch / CSRF attacks', async () => {
    const res = await request(app)
      .get('/api/auth/google/callback?code=mock_code&state=attack_state')
      .set('Cookie', ['oauth_state=legit_state']);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oauth=state_mismatch');
  });

  it('GET /api/auth/google/callback rejects unverified Google email identities', async () => {
    mockGetToken.mockResolvedValueOnce({
      tokens: { id_token: 'mock_unverified_token' },
    });
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: 'google_sub_unverified_123',
        email: 'unverified@medicore.dev',
        email_verified: false,
      }),
    });

    const res = await request(app)
      .get('/api/auth/google/callback?code=valid_code&state=valid_state')
      .set('Cookie', ['oauth_state=valid_state']);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oauth=email_not_verified');
  });

  it('GET /api/auth/google/callback rejects unknown Google users from creating staff accounts', async () => {
    mockGetToken.mockResolvedValueOnce({
      tokens: { id_token: 'mock_token' },
    });
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: 'unknown_google_sub_999',
        email: 'random.stranger@gmail.com',
        email_verified: true,
        name: 'Random Stranger',
      }),
    });

    // Mock User queries returning null
    const findOneSpy = vi.spyOn(User, 'findOne').mockResolvedValue(null);

    const res = await request(app)
      .get('/api/auth/google/callback?code=valid_code&state=valid_state')
      .set('Cookie', ['oauth_state=valid_state']);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oauth=unauthorized');
    expect(res.headers.location).toContain('random.stranger%40gmail.com');

    findOneSpy.mockRestore();
  });

  it('GET /api/auth/google/callback requires explicit password verification before linking existing staff account', async () => {
    mockGetToken.mockResolvedValueOnce({
      tokens: { id_token: 'mock_token' },
    });
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: 'google_sub_doctor_777',
        email: 'dr.sharma@medicore.dev',
        email_verified: true,
        name: 'Dr. Arjun Sharma',
      }),
    });

    const mockStaff = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Dr. Arjun Sharma',
      email: 'dr.sharma@medicore.dev',
      role: 'DOCTOR',
      isActive: true,
      passwordHash: 'hashed_password',
      select: vi.fn().mockReturnThis(),
    };

    // First query for googleId returns null; second query for email returns existing staff
    const findOneSpy = vi
      .spyOn(User, 'findOne')
      .mockResolvedValueOnce(null) // googleId lookup
      .mockResolvedValueOnce(mockStaff as any); // email lookup

    const res = await request(app)
      .get('/api/auth/google/callback?code=valid_code&state=valid_state')
      .set('Cookie', ['oauth_state=valid_state']);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oauth=link_required');
    expect(res.headers.location).toContain('dr.sharma%40medicore.dev');
    expect(res.headers.location).toContain('token='); // Contains linking token

    findOneSpy.mockRestore();
  });

  it('GET /api/auth/google/callback logs in already linked active staff member and issues session cookie', async () => {
    mockGetToken.mockResolvedValueOnce({
      tokens: { id_token: 'mock_token' },
    });
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: 'already_linked_sub_123',
        email: 'admin@medicore.dev',
        email_verified: true,
      }),
    });

    const mockLinkedUser = {
      _id: '507f1f77bcf86cd799439012',
      name: 'Admin User',
      email: 'admin@medicore.dev',
      role: 'ADMIN',
      isActive: true,
      googleId: 'already_linked_sub_123',
      toJSON: () => ({
        _id: '507f1f77bcf86cd799439012',
        name: 'Admin User',
        email: 'admin@medicore.dev',
        role: 'ADMIN',
      }),
    };

    const findOneSpy = vi.spyOn(User, 'findOne').mockResolvedValueOnce(mockLinkedUser as any);

    const res = await request(app)
      .get('/api/auth/google/callback?code=valid_code&state=valid_state')
      .set('Cookie', ['oauth_state=valid_state']);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oauth=success');

    // Verify session token cookie was issued
    const cookies = res.headers['set-cookie'] || [];
    const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain('HttpOnly');

    findOneSpy.mockRestore();
  });

  it('GET /api/auth/google/callback rejects deactivated staff account', async () => {
    mockGetToken.mockResolvedValueOnce({
      tokens: { id_token: 'mock_token' },
    });
    mockVerifyIdToken.mockResolvedValueOnce({
      getPayload: () => ({
        sub: 'deactivated_sub_456',
        email: 'former.staff@medicore.dev',
        email_verified: true,
      }),
    });

    const mockDeactivatedUser = {
      _id: '507f1f77bcf86cd799439013',
      email: 'former.staff@medicore.dev',
      role: 'RECEPTIONIST',
      isActive: false,
    };

    const findOneSpy = vi.spyOn(User, 'findOne').mockResolvedValueOnce(mockDeactivatedUser as any);

    const res = await request(app)
      .get('/api/auth/google/callback?code=valid_code&state=valid_state')
      .set('Cookie', ['oauth_state=valid_state']);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain('oauth=deactivated');

    findOneSpy.mockRestore();
  });

  it('POST /api/auth/google/link rejects invalid password during linking', async () => {
    const linkingToken = jwt.sign(
      {
        sub: 'new_google_sub_111',
        email: 'dr.sharma@medicore.dev',
        purpose: 'link_google_account',
      },
      config.jwtSecret,
      { expiresIn: '5m' }
    );

    const mockStaff = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Dr. Arjun Sharma',
      email: 'dr.sharma@medicore.dev',
      role: 'DOCTOR',
      isActive: true,
      passwordHash: await bcrypt.hash('CorrectPassword123', 10),
    };

    const findOneSpy = vi.spyOn(User, 'findOne').mockReturnValue({
      select: vi.fn().mockResolvedValue(mockStaff),
    } as any);

    const res = await request(app)
      .post('/api/auth/google/link')
      .send({ linkingToken, password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Incorrect hospital security password/i);

    findOneSpy.mockRestore();
  });

  it('POST /api/auth/google/link safely links Google identity upon correct password', async () => {
    const linkingToken = jwt.sign(
      {
        sub: 'new_google_sub_111',
        email: 'dr.sharma@medicore.dev',
        purpose: 'link_google_account',
      },
      config.jwtSecret,
      { expiresIn: '5m' }
    );

    const mockStaff = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Dr. Arjun Sharma',
      email: 'dr.sharma@medicore.dev',
      role: 'DOCTOR',
      isActive: true,
      passwordHash: await bcrypt.hash('Doctor@12345', 10),
      save: vi.fn().mockResolvedValue(true),
      toJSON: () => ({
        _id: '507f1f77bcf86cd799439011',
        name: 'Dr. Arjun Sharma',
        email: 'dr.sharma@medicore.dev',
        role: 'DOCTOR',
        googleId: 'new_google_sub_111',
      }),
    };

    const findOneSpy = vi
      .spyOn(User, 'findOne')
      .mockReturnValueOnce({
        select: vi.fn().mockResolvedValueOnce(mockStaff),
      } as any) // lookup staff
      .mockResolvedValueOnce(null); // lookup conflicting sub

    const res = await request(app)
      .post('/api/auth/google/link')
      .send({ linkingToken, password: 'Doctor@12345' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('googleId', 'new_google_sub_111');

    // Confirm session cookie was issued
    const cookies = res.headers['set-cookie'] || [];
    const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
    expect(tokenCookie).toBeDefined();

    findOneSpy.mockRestore();
  });
});
