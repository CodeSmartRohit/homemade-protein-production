const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');
const seedDatabase = require('./utils/seed');

const run = async () => {
  console.log('--- STARTING MANUAL SEEDING ---');
  await connectDB();
  await seedDatabase();
  console.log('--- MANUAL SEEDING COMPLETE ---');
  console.log('⏳ Waiting for disk writes to flush...');
  setTimeout(() => {
    console.log('✅ Done.');
    process.exit(0);
  }, 2000);
};

run();
