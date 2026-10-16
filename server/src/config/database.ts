import dns from 'dns';
import mongoose from 'mongoose';
import { config } from './config';

// Fix Windows DNS SRV lookup issues for MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore in restricted environments
}

export async function connectDB(): Promise<void> {
  let primaryUri = config.mongoUri || 'mongodb://127.0.0.1:27017/medicore_db';
  // Strip placeholder angle brackets if entered literally: :<password> -> :password
  primaryUri = primaryUri.replace(/:<([^>]+)>/, ':$1');

  const sanitizedUri = primaryUri.replace(/:([^@:]+)@/, ':****@');
  const fallbackUri = 'mongodb://127.0.0.1:27017/medicore_db';

  mongoose.set('strictQuery', true);

  try {
    const isAtlas = primaryUri.includes('mongodb+srv');
    console.log(`📡 Connecting to MongoDB (${isAtlas ? 'MongoDB Atlas Cloud Cluster' : 'Local MongoDB'})...`);
    await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 8000 });
    console.log(`✅ MongoDB connected successfully to: ${mongoose.connection.host}`);
  } catch (err: any) {
    console.error(`❌ Primary MongoDB connection failed (${err.message})`);
    console.error(`Target URI: ${sanitizedUri}`);

    if (!config.isProduction && primaryUri !== fallbackUri) {
      console.log(`🔄 Attempting local development MongoDB fallback (${fallbackUri})...`);
      try {
        await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 3000 });
        console.log(`✅ Connected to local MongoDB fallback: ${mongoose.connection.host}`);
      } catch (fallbackErr: any) {
        console.error(`❌ Local MongoDB fallback also failed: ${fallbackErr.message}`);
        throw err;
      }
    } else {
      if (config.isProduction) {
        console.error('🚨 Production MongoDB Atlas connection error. Verify that:');
        console.error('   1. MONGODB_URI environment variable is configured in Render dashboard.');
        console.error('   2. MongoDB Atlas Network Access has IP 0.0.0.0/0 (allow access from anywhere) whitelisted.');
        console.error('   3. Database user has readWrite access to the target database.');
      }
      throw err;
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });
}
