require('dotenv').config();
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}
const mongoose = require('mongoose');

const rawUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medicore_db';
const uri = rawUri.replace(/:<([^>]+)>/, ':$1');

console.log('Connecting to:', uri.replace(/:[^:]*@/, ':****@'));

mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
  .then(async () => {
    console.log('✅ Connected successfully to MongoDB Database!');
    console.log('Host:', mongoose.connection.host);
    console.log('DB Name:', mongoose.connection.name);
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Existing collections:', collections.map(c => c.name));
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection failed with error:');
    console.error('Code:', err.code);
    console.error('Message:', err.message);
    process.exit(1);
  });
