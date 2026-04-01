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

    // Seed chef account if none exists or update password
    const chefUser = await User.findOne({ role: 'chef' });
    const chefSalt = await bcrypt.genSalt(12);
    const chefHashedPassword = await bcrypt.hash('123456', chefSalt);

    if (!chefUser) {
      await User.create({
        name: 'Chef Rohit',
        email: 'chef@gmail.com',
        password: chefHashedPassword,
        phone: '9340623657',
        role: 'chef',
        isVerified: true,
        isActive: true,
      });
      console.log('✅ Chef account created (chef@gmail.com / 123456)');
    } else {
      chefUser.email = 'chef@gmail.com'; // In case it was mistakenly changed
      chefUser.password = chefHashedPassword;
      chefUser.phone = '9340623657';
      await chefUser.save();
      console.log('✅ Chef account updated to new password: 123456');
    }

    // Seed admin account if none exists or update password
    const adminUser = await User.findOne({ role: 'admin' });
    const adminSalt = await bcrypt.genSalt(12);
    const adminHashedPassword = await bcrypt.hash('ROHITCODESMARTLY!', adminSalt);

    if (!adminUser) {
      await User.create({
        name: 'Admin',
        email: 'rp111monster@gmail.com',
        password: adminHashedPassword,
        phone: '9340623657',
        role: 'admin',
        isVerified: true,
        isActive: true,
      });
      console.log('✅ Admin account created (rp111monster@gmail.com / ROHITCODESMARTLY!)');
    } else {
      adminUser.email = 'rp111monster@gmail.com'; // Ensure unique email
      adminUser.password = adminHashedPassword;
      adminUser.phone = '9340623657';
      await adminUser.save();
      console.log('✅ Admin account updated to new password: ROHITCODESMARTLY!');
    }

    console.log('✅ Database seeding complete');
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  }
};

module.exports = seedDatabase;
