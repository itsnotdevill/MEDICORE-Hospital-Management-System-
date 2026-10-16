import { Router } from 'express';
import { login, register, logout, getMe, updateProfile, changePassword } from '../controllers/authController';
import {
  startGoogleAuth,
  handleGoogleCallback,
  linkGoogleAccount,
  unlinkGoogleAccount,
  verifyGoogleCredential,
  getGoogleConfig,
} from '../controllers/googleAuthController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);

// ── Google OAuth 2.0 / OpenID Connect Routes ──────────────────────────────
router.get('/google', startGoogleAuth);
router.get('/google/callback', handleGoogleCallback);
router.post('/google/link', linkGoogleAccount);
router.post('/google/unlink', authenticate, unlinkGoogleAccount);
router.post('/google/verify-credential', verifyGoogleCredential);
router.get('/google/config', getGoogleConfig);

export default router;
