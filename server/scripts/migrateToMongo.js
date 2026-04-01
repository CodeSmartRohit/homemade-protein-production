require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Models
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

// Helper: UUID to ObjectId (Deterministic)
const uuidToObjectId = (uuid) => {
  if (!uuid) return null;
  // If it's already a valid ObjectId string, return it
  if (mongoose.Types.ObjectId.isValid(uuid)) return new mongoose.Types.ObjectId(uuid);
  
  // Otherwise, hash the UUID to create a 24-character hex string
  const hash = crypto.createHash('md5').update(uuid).digest('hex').substring(0, 24);
  return new mongoose.Types.ObjectId(hash);
};

const DATA_DIR = path.join(__dirname, '../data');

async function migrate() {
  try {
    console.log('🚀 Starting Data Migration to MongoDB...');
    
    // Connect to DB
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
    });
    console.log('✅ Connected to MongoDB');

    // 1. Migrate Users
    const usersData = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'users.json'), 'utf-8'));
    console.log(`📂 Found ${usersData.length} users...`);
    for (const u of usersData) {
      const id = uuidToObjectId(u._id);
      await User.findOneAndUpdate(
        { _id: id },
        { ...u, _id: id },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Users synchronized');

    // 2. Migrate Categories
    const categoriesData = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'categories.json'), 'utf-8'));
    console.log(`📂 Found ${categoriesData.length} categories...`);
    for (const c of categoriesData) {
      const id = uuidToObjectId(c._id);
      await Category.findOneAndUpdate(
        { _id: id },
        { ...c, _id: id },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Categories synchronized');

    // 3. Migrate MenuItems
    const menuData = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'menuItems.json'), 'utf-8'));
    console.log(`📂 Found ${menuData.length} menu items...`);
    for (const m of menuData) {
      const id = uuidToObjectId(m._id);
      const catId = uuidToObjectId(m.category);
      await MenuItem.findOneAndUpdate(
        { _id: id },
        { ...m, _id: id, category: catId },
        { upsert: true, new: true }
      );
    }
    console.log('✅ MenuItems synchronized');

    // 4. Migrate Orders
    const ordersData = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'orders.json'), 'utf-8'));
    console.log(`📂 Found ${ordersData.length} orders...`);
    for (const o of ordersData) {
      const id = uuidToObjectId(o._id);
      const customerId = uuidToObjectId(o.customer);
      const mappedItems = o.items.map(item => ({
        ...item,
        menuItem: uuidToObjectId(item.menuItem)
      }));
      
      await Order.findOneAndUpdate(
        { _id: id },
        { ...o, _id: id, customer: customerId, items: mappedItems },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Orders synchronized');

    console.log('🏁 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
