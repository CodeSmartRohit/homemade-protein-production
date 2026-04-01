const mongoose = require('mongoose');
const localDb = require('../utils/localDb');

const connectDB = async () => {
  try {
    // If MONGODB_URI is provided in .env, connect to it
    if (process.env.MONGODB_URI) {
      const options = {
        maxPoolSize: 50,
        minPoolSize: 10,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 10000, // 10 sec timeout (increased for cloud)
        heartbeatFrequencyMS: 10000,
      };
      const conn = await mongoose.connect(process.env.MONGODB_URI, options);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return true;
    }
    
    // Otherwise, fall back to safe Local JSON storage (Development mode)
    console.warn('⚠️ No MONGODB_URI found. Using Local JSON database...');
    localDb.init();
    return true;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn('⚠️ Falling back to Local JSON database...');
    
    // Gracefully fall back to local DB instead of crashing
    localDb.init();
    return true;
  }
};

module.exports = connectDB;
