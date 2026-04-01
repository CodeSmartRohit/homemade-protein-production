const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const localDb = require('./localDb');
const User = require('../models/User');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');

const migrate = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env');
      return;
    }

    console.log('🚀 Starting Industrial-Strength Migration...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Maps to store old ID -> New ObjectId
    const userMap = {};
    const categoryMap = {};
    const menuMap = {};

    localDb.init();

    // 1. Migrate Categories
    const categories = localDb.categories.find();
    console.log(`📦 Migrating ${categories.length} Categories...`);
    for (const cat of categories) {
      const { _id, ...data } = cat;
      const newCat = await Category.findOneAndUpdate({ name: data.name }, data, { upsert: true, new: true });
      categoryMap[_id] = newCat._id;
    }

    // 2. Migrate Menu Items
    const menuItems = localDb.menuItems.find();
    console.log(`🍱 Migrating ${menuItems.length} Menu Items...`);
    for (const item of menuItems) {
      const { _id, category, ...data } = item;
      if (category) data.category = categoryMap[category] || null;
      const newItem = await MenuItem.findOneAndUpdate({ name: data.name }, data, { upsert: true, new: true });
      menuMap[_id] = newItem._id;
    }

    // 3. Migrate Users
    const users = localDb.users.find();
    console.log(`👤 Migrating ${users.length} Users...`);
    for (const user of users) {
      const { _id, ...data } = user;
      const newUser = await User.findOneAndUpdate({ email: data.email }, data, { upsert: true, new: true });
      userMap[_id] = newUser._id;
    }

    // 4. Migrate Orders
    const orders = localDb.orders.find();
    console.log(`🛒 Migrating ${orders.length} Orders...`);
    for (const order of orders) {
      const { _id, customer, items, ...data } = order;
      
      // Update customer ID
      if (customer) data.customer = userMap[customer] || null;
      
      // Update items' menuItem IDs
      data.items = items.map(item => ({
        ...item,
        menuItem: menuMap[item.menuItem] || null
      }));

      await Order.findOneAndUpdate({ orderNumber: data.orderNumber }, data, { upsert: true });
    }

    console.log('🎉 Migration Successful! All data has been moved to MongoDB.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration Failed:', err);
    process.exit(1);
  }
};

migrate();
