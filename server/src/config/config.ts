import dotenv from 'dotenv';
dotenv.config();

const port = parseInt(process.env.PORT || '5000', 10);
const isProduction = process.env.NODE_ENV === 'production';
const serverPublicUrl = process.env.SERVER_PUBLIC_URL || (isProduction ? '' : `http://localhost:${port}`);
const clientOrigin = process.env.CLIENT_ORIGIN || (isProduction ? serverPublicUrl : 'http://localhost:5173');

export const config = {
  port,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri:
    process.env.MONGODB_URI ||
    'mongodb+srv://medicore_db:medicore_dbofficial@cluster0.a9jzgrg.mongodb.net/medicore_db?retryWrites=true&w=majority',
  jwtSecret: process.env.JWT_SECRET || 'medicore_super_secure_jwt_secret_development_key_university_project_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  clientOrigin,
  serverPublicUrl,
  isProduction,
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ||
    (serverPublicUrl
      ? `${serverPublicUrl.replace(/\/$/, '')}/api/auth/google/callback`
      : `http://localhost:${port}/api/auth/google/callback`),
};
