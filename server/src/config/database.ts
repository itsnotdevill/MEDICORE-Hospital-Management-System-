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

  const fallbackUri = 'mongodb://127.0.0.1:27017/medicore_db';

  mongoose.set('strictQuery', true);

  try {
    const isAtlas = primaryUri.includes('mongodb+srv');
    console.log(`Connecting to MongoDB (${isAtlas ? 'MongoDB Atlas Cluster' : 'Local MongoDB'})...`);
    await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB connected successfully to: ${mongoose.connection.host}`);
  } catch (err: any) {
    console.warn(`⚠️ Primary MongoDB connection failed (${err.message})`);
    if (primaryUri !== fallbackUri) {
      console.log(`🔄 Connecting to local MongoDB fallback: ${fallbackUri}...`);
      try {
        await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 3000 });
        console.log(`✅ Connected to local MongoDB fallback: ${mongoose.connection.host}`);
      } catch (fallbackErr: any) {
        console.error(`❌ Local MongoDB fallback also failed: ${fallbackErr.message}`);
        throw err;
      }
    } else {
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
