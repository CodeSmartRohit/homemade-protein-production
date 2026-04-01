const Category = require('../models/Category');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    // Seed categories if empty
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const categories = [
        { name: 'Protein Bowls', description: 'High-protein meal bowls', displayOrder: 1, slug: 'protein-bowls' },
        { name: 'Protein Shakes', description: 'Delicious protein shakes & smoothies', displayOrder: 2, slug: 'protein-shakes' },
        { name: 'Protein Bars', description: 'Handmade protein bars & snacks', displayOrder: 3, slug: 'protein-bars' },
        { name: 'Meal Prep', description: 'Ready-to-eat meal prep boxes', displayOrder: 4, slug: 'meal-prep' },
        { name: 'Desserts', description: 'Healthy protein-rich desserts', displayOrder: 5, slug: 'desserts' },
        { name: 'Beverages', description: 'Healthy drinks & juices', displayOrder: 6, slug: 'beverages' },
        { name: 'Special Items', description: 'Limited edition & seasonal items', displayOrder: 7, slug: 'special-items' },
      ];

      for (const cat of categories) {
        await Category.create(cat);
      }
      console.log('✅ Categories seeded');
    }

    const mongoose = require('mongoose');
    const isMongo = mongoose.connection.readyState === 1;
    const dbMode = isMongo ? '☁️ MongoDB' : '📁 Local JSON DB';

    console.log(`📡 Seeding in ${dbMode} mode...`);

    // Seed chef account if none exists or update password
    const chefSalt = await bcrypt.genSalt(12);
    const chefHashedPassword = await bcrypt.hash('123456', chefSalt);

    const chefQuery = { role: 'chef' };
    const chefData = {
      name: 'Chef Rohit',
      email: 'chef@gmail.com',
      password: chefHashedPassword,
      phone: '9340623657',
      role: 'chef',
      isVerified: true,
      isActive: true,
    };

    let chefDoc = await User.findOne(chefQuery);
    if (!chefDoc) {
       chefDoc = await User.create(chefData);
       console.log(`✅ New Chef account created (${chefData.email} / 123456)`);
    } else {
       await User.findOneAndUpdate(chefQuery, chefData);
       console.log(`✅ Chef account updated (${chefData.email} / 123456)`);
    }

    // Seed admin account if none exists or update password
    console.log(`🔍 Checking for Admin: rp111monster@gmail.com...`);
    const adminSalt = await bcrypt.genSalt(12);
    const adminHashedPassword = await bcrypt.hash('ROHITCODESMARTLY!', adminSalt);

    const adminQuery = { role: 'admin' };
    const adminData = {
      name: 'Admin',
      email: 'rp111monster@gmail.com',
      password: adminHashedPassword,
      phone: '9340623657',
      role: 'admin',
      isVerified: true,
      isActive: true,
    };

    let adminDoc = await User.findOne(adminQuery);
    if (!adminDoc) {
       adminDoc = await User.create(adminData);
       console.log(`✅ New Admin account created (${adminData.email} / ROHITCODESMARTLY!)`);
    } else {
       await User.findOneAndUpdate(adminQuery, adminData);
       console.log(`✅ Admin account updated (${adminData.email} / ROHITCODESMARTLY!)`);
    }

    console.log('✅ Database seeding complete');
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  }
};

module.exports = seedDatabase;
