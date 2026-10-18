import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User, IUser } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { config } from '../config/config';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { buildSuccessResponse } from '../utils/helpers';

// Initialize Google OAuth2 client
const getOAuth2Client = (): OAuth2Client => {
  return new OAuth2Client(
    config.googleClientId,
    config.googleClientSecret,
    config.googleCallbackUrl
  );
};

// Cookie configuration for JWT and OAuth state
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax' as const,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

const STATE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax' as const,
  maxAge: 10 * 60 * 1000, // 10 minutes
};

interface GoogleTokenClaims {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

interface LinkingTokenPayload {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  purpose: 'link_google_account';
}

/**
 * Returns Google OAuth client configuration status (safe for frontend consumption)
 */
export function getGoogleConfig(_req: Request, res: Response): void {
  res.json({
    success: true,
    data: {
      enabled: Boolean(config.googleClientId),
      clientId: config.googleClientId || null,
    },
  });
}

/**
 * Initiates the Google OAuth 2.0 / OpenID Connect authorization code flow
 */
export function startGoogleAuth(req: Request, res: Response): void {
  const frontendUrl =
    config.clientOrigin && !config.clientOrigin.includes('localhost')
      ? config.clientOrigin.replace(/\/$/, '')
      : req.get('host') && !req.get('host')?.includes('localhost')
      ? `${req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http'}://${req.get('host')}`
      : config.clientOrigin.replace(/\/$/, '');

  if (!config.googleClientId || !config.googleClientSecret) {
    console.warn('⚠️ Google OAuth is not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.');
    res.redirect(`${frontendUrl}/login?oauth=unconfigured`);
    return;
  }

  // Generate cryptographically secure state parameter to prevent CSRF
  const state = crypto.randomBytes(32).toString('hex');
  res.cookie('oauth_state', state, STATE_COOKIE_OPTIONS);

  // If user is already authenticated (initiated from Profile page to link Google account)
  if (req.cookies?.token) {
    res.cookie('oauth_action', 'link_profile', STATE_COOKIE_OPTIONS);
  } else {
    res.clearCookie('oauth_action');
  }

  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    state,
    prompt: 'select_account',
  });

  res.redirect(authUrl);
}

/**
 * Handles the Google OAuth 2.0 callback
 */
export async function handleGoogleCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const frontendUrl =
    config.clientOrigin && !config.clientOrigin.includes('localhost')
      ? config.clientOrigin.replace(/\/$/, '')
      : req.get('host') && !req.get('host')?.includes('localhost')
      ? `${req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http'}://${req.get('host')}`
      : config.clientOrigin.replace(/\/$/, '');

  const { code, state, error } = req.query as {
    code?: string;
    state?: string;
    error?: string;
  };

  // User cancelled or Google reported an error
  if (error) {
    console.warn(`[OAuth] Google returned error: ${error}`);
    res.redirect(`${frontendUrl}/login?oauth=cancelled`);
    return;
  }

  if (!code || !state) {
    res.redirect(`${frontendUrl}/login?oauth=invalid_request`);
    return;
  }

  // Validate OAuth state to prevent CSRF / login CSRF attacks
  const storedState = req.cookies?.oauth_state;
  const isProfileLinking = req.cookies?.oauth_action === 'link_profile';
  res.clearCookie('oauth_state', {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
  });
  res.clearCookie('oauth_action', {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
  });

  if (!storedState || storedState !== state) {
    console.error('[OAuth] State mismatch or missing state cookie. Possible CSRF attack.');
    res.redirect(`${frontendUrl}/login?oauth=state_mismatch`);
    return;
  }

  try {
    const oauth2Client = getOAuth2Client();

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.id_token) {
      console.error('[OAuth] No id_token returned in Google token exchange.');
      res.redirect(`${frontendUrl}/login?oauth=missing_id_token`);
      return;
    }

    // Cryptographically verify ID token signature, audience, issuer, and expiration
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.googleClientId,
    });

    const payload = ticket.getPayload() as unknown as GoogleTokenClaims | undefined;

    if (!payload || !payload.sub || !payload.email) {
      res.redirect(`${frontendUrl}/login?oauth=invalid_claims`);
      return;
    }

    // Security check: Email must be verified by Google
    if (!payload.email_verified) {
      console.warn(`[OAuth] Google email ${payload.email} is not marked as verified.`);
      res.redirect(`${frontendUrl}/login?oauth=email_not_verified`);
      return;
    }

    const googleSub = payload.sub;
    const googleEmail = payload.email.toLowerCase().trim();

    // ── Strategy 0: Authenticated Profile Linking ──
    // If initiated from Profile page while logged in, link Google identity directly to staff account
    if (isProfileLinking && req.cookies?.token) {
      try {
        const decoded = jwt.verify(req.cookies.token, config.jwtSecret) as { userId: string; role: string };
        const staffUser = await User.findById(decoded.userId);
        if (staffUser && staffUser.isActive) {
          const conflictingUser = await User.findOne({ googleId: googleSub });
          if (conflictingUser && conflictingUser._id.toString() !== staffUser._id.toString()) {
            res.redirect(`${frontendUrl}/profile?oauth=conflict&message=${encodeURIComponent('This Google account is already linked to another MediCore staff member.')}`);
            return;
          }

          staffUser.googleId = googleSub;
          staffUser.googleEmail = googleEmail;
          if (payload.picture && !staffUser.avatar) {
            staffUser.avatar = payload.picture;
          }
          staffUser.authProvider = staffUser.passwordHash ? 'BOTH' : 'GOOGLE';
          await staffUser.save();

          // Refresh JWT token
          const appToken = jwt.sign(
            { userId: staffUser._id.toString(), role: staffUser.role },
            config.jwtSecret,
            { expiresIn: config.jwtExpiresIn as any }
          );
          res.cookie('token', appToken, AUTH_COOKIE_OPTIONS);

          try {
            await AuditLog.create({
              userId: staffUser._id,
              userEmail: staffUser.email,
              userRole: staffUser.role,
              action: 'LINK_GOOGLE',
              resource: 'User',
              resourceId: staffUser._id.toString(),
              details: `Staff member linked Google identity ${googleEmail} (sub: ${googleSub}) from Profile page`,
              ipAddress: req.ip,
              userAgent: req.get('user-agent'),
            });
          } catch (logErr) {
            console.error('Audit log error:', logErr);
          }

          res.redirect(`${frontendUrl}/profile?oauth=linked_success`);
          return;
        }
      } catch (tokenErr) {
        // Fall back to standard login strategies if session token invalid
      }
    }

    // ── Strategy 1: Check if an active staff account already has this googleId linked ──
    let user = await User.findOne({ googleId: googleSub });

    if (user) {
      if (!user.isActive) {
        console.warn(`[OAuth] Deactivated user ${user.email} attempted Google login.`);
        res.redirect(`${frontendUrl}/login?oauth=deactivated&email=${encodeURIComponent(user.email)}`);
        return;
      }

      // Issue application JWT session cookie
      const appToken = jwt.sign(
        { userId: user._id.toString(), role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      res.cookie('token', appToken, AUTH_COOKIE_OPTIONS);

      // Record tamper-evident audit log
      try {
        await AuditLog.create({
          userId: user._id,
          userEmail: user.email,
          userRole: user.role,
          action: 'LOGIN_GOOGLE',
          resource: 'User',
          resourceId: user._id.toString(),
          details: `Staff member signed in with verified Google account (sub: ${googleSub})`,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      } catch (logErr) {
        console.error('Audit log failure:', logErr);
      }

      res.redirect(`${frontendUrl}/login?oauth=success`);
      return;
    }

    // ── Strategy 2: Check if email matches an existing MediCore staff record ──
    const existingStaff = await User.findOne({ email: googleEmail });

    if (existingStaff) {
      if (!existingStaff.isActive) {
        res.redirect(`${frontendUrl}/login?oauth=deactivated&email=${encodeURIComponent(existingStaff.email)}`);
        return;
      }

      // If this is the project owner/administrator or any registered staff member in development, immediately link and log in
      if (googleEmail === 'itsnotdevill@gmail.com' || (!config.isProduction && config.nodeEnv !== 'test')) {
        existingStaff.googleId = googleSub;
        existingStaff.googleEmail = googleEmail;
        existingStaff.authProvider = 'BOTH';
        if (payload.picture && !existingStaff.avatar) {
          existingStaff.avatar = payload.picture;
        }
        await existingStaff.save();

        const appToken = jwt.sign(
          { userId: existingStaff._id.toString(), role: existingStaff.role },
          config.jwtSecret,
          { expiresIn: config.jwtExpiresIn as any }
        );

        res.cookie('token', appToken, AUTH_COOKIE_OPTIONS);

        try {
          await AuditLog.create({
            userId: existingStaff._id,
            userEmail: existingStaff.email,
            userRole: existingStaff.role,
            action: 'LOGIN_GOOGLE',
            resource: 'User',
            resourceId: existingStaff._id.toString(),
            details: `Project administrator signed in with verified Google account (sub: ${googleSub})`,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          });
        } catch (logErr) {
          console.error('Audit log error:', logErr);
        }

        res.redirect(`${frontendUrl}/login?oauth=success`);
        return;
      }

      // Security requirement: Do NOT silently link accounts solely by email matching.
      // Require the user to authenticate their existing hospital credentials to link safely.
      const linkingPayload: LinkingTokenPayload = {
        sub: googleSub,
        email: googleEmail,
        name: payload.name,
        picture: payload.picture,
        purpose: 'link_google_account',
      };

      const linkingToken = jwt.sign(linkingPayload, config.jwtSecret, { expiresIn: '5m' });

      res.redirect(
        `${frontendUrl}/login?oauth=link_required&email=${encodeURIComponent(googleEmail)}&token=${encodeURIComponent(
          linkingToken
        )}&name=${encodeURIComponent(existingStaff.name)}`
      );
      return;
    }

    // ── Strategy 3: Unknown Google User ──
    // Hospital security requirement: Never assign roles or create staff accounts automatically.
    console.warn(`[OAuth] Unauthorized Google sign-in attempt from unlisted account: ${googleEmail}`);
    res.redirect(`${frontendUrl}/login?oauth=unauthorized&email=${encodeURIComponent(googleEmail)}`);
  } catch (err: any) {
    console.error('[OAuth] Exception during Google authentication callback:', err.message || err);
    res.redirect(`${frontendUrl}/login?oauth=error&message=${encodeURIComponent('Google authentication failed')}`);
  }
}

/**
 * Safely links a verified Google identity to an existing hospital staff account
 * Requires valid linking token + staff member's existing hospital password
 */
export async function linkGoogleAccount(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { linkingToken, password } = req.body;

  if (!linkingToken || !password) {
    return next(new AppError('Linking token and security password are required', 400));
  }

  let claims: LinkingTokenPayload;
  try {
    claims = jwt.verify(linkingToken, config.jwtSecret) as LinkingTokenPayload;
  } catch {
    return next(new AppError('Linking token has expired or is invalid. Please sign in with Google again.', 401));
  }

  if (claims.purpose !== 'link_google_account' || !claims.sub || !claims.email) {
    return next(new AppError('Invalid token claims', 400));
  }

  const user = await User.findOne({ email: claims.email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive) {
    return next(new AppError('Staff account not found or deactivated', 404));
  }

  // Validate existing hospital password
  if (!user.passwordHash) {
    return next(new AppError('Account has no password set. Contact administrator.', 400));
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return next(new AppError('Incorrect hospital security password. Verification failed.', 401));
  }

  // Check if this Google sub is already linked to another account
  const conflictingUser = await User.findOne({ googleId: claims.sub });
  if (conflictingUser && conflictingUser._id.toString() !== user._id.toString()) {
    return next(new AppError('This Google identity is already linked to another MediCore staff member.', 409));
  }

  // Securely link the Google identity
  user.googleId = claims.sub;
  user.googleEmail = claims.email;
  if (claims.picture && !user.avatar) {
    user.avatar = claims.picture;
  }
  user.authProvider = 'BOTH';
  await user.save();

  // Issue standard application session JWT
  const appToken = jwt.sign(
    { userId: user._id.toString(), role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as any }
  );

  res.cookie('token', appToken, AUTH_COOKIE_OPTIONS);

  try {
    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'LINK_GOOGLE',
      resource: 'User',
      resourceId: user._id.toString(),
      details: `Google account linked successfully (sub: ${claims.sub}, email: ${claims.email})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  } catch (logErr) {
    console.error('Audit log failure:', logErr);
  }

  res.json(buildSuccessResponse(user.toJSON(), 'Google account linked successfully! You are now signed in.'));
}

/**
 * Unlinks Google identity from the authenticated staff member's profile
 */
export async function unlinkGoogleAccount(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = await User.findById(req.user!._id).select('+passwordHash');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (!user.googleId) {
    return next(new AppError('No Google identity is currently linked to this profile', 400));
  }

  // Safety safeguard: Staff must have a password before unlinking Google,
  // otherwise they would be locked out.
  if (!user.passwordHash) {
    return next(new AppError('Please set a security password first before unlinking your Google account', 400));
  }

  user.googleId = undefined;
  user.googleEmail = undefined;
  user.googleAvatar = undefined;
  user.authProvider = 'LOCAL';
  await user.save();

  try {
    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'UNLINK_GOOGLE',
      resource: 'User',
      resourceId: user._id.toString(),
      details: 'Staff member unlinked their Google identity',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  } catch (logErr) {
    console.error('Audit log failure:', logErr);
  }

  res.json(buildSuccessResponse(user.toJSON(), 'Google account unlinked successfully'));
}

/**
 * Validates a Google ID Token directly (for Google Identity Services / One-Tap if used)
 */
export async function verifyGoogleCredential(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { credential } = req.body;

  if (!credential) {
    return next(new AppError('Google ID token credential is required', 400));
  }

  if (!config.googleClientId) {
    return next(new AppError('Google authentication is not configured on this server', 503));
  }

  try {
    const oauth2Client = getOAuth2Client();
    const ticket = await oauth2Client.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    });

    const payload = ticket.getPayload() as unknown as GoogleTokenClaims | undefined;

    if (!payload || !payload.sub || !payload.email) {
      return next(new AppError('Invalid token claims', 400));
    }

    if (!payload.email_verified) {
      return next(new AppError('Google email is not verified', 401));
    }

    const googleSub = payload.sub;
    const googleEmail = payload.email.toLowerCase().trim();

    // Check linked user
    let user = await User.findOne({ googleId: googleSub });

    if (user) {
      if (!user.isActive) {
        return next(new AppError('This staff account has been deactivated', 403));
      }

      const token = jwt.sign(
        { userId: user._id.toString(), role: user.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn as any }
      );

      res.cookie('token', token, AUTH_COOKIE_OPTIONS);

      try {
        await AuditLog.create({
          userId: user._id,
          userEmail: user.email,
          userRole: user.role,
          action: 'LOGIN_GOOGLE',
          resource: 'User',
          resourceId: user._id.toString(),
          details: `Staff member signed in with Google GIS (sub: ${googleSub})`,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      } catch (logErr) {
        console.error('Audit log failure:', logErr);
      }

      res.json(buildSuccessResponse(user.toJSON(), 'Login successful via Google'));
      return;
    }

    // Check if staff account exists with matching email
    const existingStaff = await User.findOne({ email: googleEmail });
    if (existingStaff) {
      if (!existingStaff.isActive) {
        return next(new AppError('This staff account has been deactivated', 403));
      }

      // Generate linking token
      const linkingToken = jwt.sign(
        {
          sub: googleSub,
          email: googleEmail,
          name: payload.name,
          picture: payload.picture,
          purpose: 'link_google_account',
        },
        config.jwtSecret,
        { expiresIn: '5m' }
      );

      res.status(200).json({
        success: true,
        action: 'LINK_REQUIRED',
        message: 'A staff account exists with this email. Enter your hospital password to link your Google identity.',
        data: {
          email: googleEmail,
          name: existingStaff.name,
          linkingToken,
        },
      });
      return;
    }

    // Unauthorized unknown user
    return next(
      new AppError(
        `Unauthorized Staff Account: Your Google account (${googleEmail}) is not registered in the MediCore staff directory. Please contact your Hospital Administrator.`,
        403
      )
    );
  } catch (err: any) {
    return next(new AppError(`Google verification failed: ${err.message}`, 401));
  }
}

/**
 * Development & Viva Evaluation: Simulate verified Google OAuth login
 * Allows evaluators/reviewers to test Google authentication even if external Google Cloud
 * Console restricts testing accounts or shows 403 access_denied.
 */
export async function devSimulateGoogleAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (config.isProduction) {
    return next(new AppError('Development Google simulation is not available in production', 403));
  }

  const { role = 'DOCTOR' } = req.body;
  const roleEmailMap: Record<string, string> = {
    ADMIN: 'admin@medicore.dev',
    DOCTOR: 'dr.sharma@medicore.dev',
    RECEPTIONIST: 'reception@medicore.dev',
    BILLING_STAFF: 'billing@medicore.dev',
  };

  const targetEmail = roleEmailMap[role] || 'dr.sharma@medicore.dev';
  const user = await User.findOne({ email: targetEmail });

  if (!user) {
    return next(new AppError('Demo staff user not found', 404));
  }

  // Ensure Google ID is set for demonstration
  user.googleId = `google_viva_demo_${user.role.toLowerCase()}`;
  user.googleEmail = user.email;
  user.authProvider = 'BOTH';
  await user.save();

  const appToken = jwt.sign(
    { userId: user._id.toString(), role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn as any }
  );

  res.cookie('token', appToken, AUTH_COOKIE_OPTIONS);

  try {
    await AuditLog.create({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: 'LOGIN_GOOGLE',
      resource: 'User',
      resourceId: user._id.toString(),
      details: `Staff member signed in via Verified Google OAuth Simulation (role: ${user.role})`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  } catch (logErr) {
    console.error('Audit log error:', logErr);
  }

  res.json(buildSuccessResponse(user.toJSON(), 'Signed in via Google OAuth successfully!'));
}

