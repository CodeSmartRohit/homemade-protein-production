const mongoose = require('mongoose');
const localDb = require('../utils/localDb');

const connectDB = async () => {
  try {
    // If MONGODB_URI is provided in .env, connect to it
    if (process.env.MONGODB_URI) {
      const options = {
        maxPoolSize: 50, // Allow up to 50 concurrent connections
        minPoolSize: 10, // Maintain a minimum of 10 connections
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        serverSelectionTimeoutMS: 5000, // Fail fast if server is unreachable
        heartbeatFrequencyMS: 10000, // Check server health every 10 seconds
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
    console.error(`❌ DB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
