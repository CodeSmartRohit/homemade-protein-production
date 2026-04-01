const db = require('../utils/localDb');

const seedData = async () => {
  try {
    console.log('🚀 Starting 3D Menu Seeding...');

    // 1. Clear existing data
    db.categories.data = [];
    db.menuItems.data = [];

    // 2. Define Categories
    const categoriesData = [
      { name: 'Shakes', slug: 'shakes', icon: 'FiCoffee', isActive: true, displayOrder: 1 },
      { name: 'Salads', slug: 'salads', icon: 'FiCloud', isActive: true, displayOrder: 2 },
      { name: 'Yogurt', slug: 'yogurt', icon: 'FiWind', isActive: true, displayOrder: 3 },
      { name: 'Burgers', slug: 'burgers', icon: 'FiCircle', isActive: true, displayOrder: 4 },
      { name: 'Pizzas', slug: 'pizzas', icon: 'FiDisc', isActive: true, displayOrder: 5 },
      { name: 'Wraps', slug: 'wraps', icon: 'FiLayers', isActive: true, displayOrder: 6 },
      { name: 'Desserts', slug: 'desserts', icon: 'FiSun', isActive: true, displayOrder: 7 },
      { name: 'Beverages', slug: 'beverages', icon: 'FiDroplet', isActive: true, displayOrder: 8 }
    ];

    const createdCategories = [];
    for (const cat of categoriesData) {
      const newCat = await db.categories.create(cat);
      createdCategories.push(newCat);
    }

    console.log(`✅ Created ${createdCategories.length} categories.`);

    // 3. Define Menu Items (2 per category)
    const itemsData = [
      // Shakes
      {
        name: 'Muscle Chocolate Shake',
        category: createdCategories.find(c => c.slug === 'shakes')._id,
        price: 249,
        description: 'High-protein chocolate shake with whey isolate and organic cocoa.',
        image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&q=80',
        isVeg: true,
        isAvailable: true
      },
      {
        name: 'Berry Blast Smoothie',
        category: createdCategories.find(c => c.slug === 'shakes')._id,
        price: 219,
        description: 'Antioxidant-rich mixed berries with greek yogurt base.',
        image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&q=80',
        isVeg: true,
        isAvailable: true
      },
      // Salads
      {
        name: 'Quinoa Green Goddess',
        category: createdCategories.find(c => c.slug === 'salads')._id,
        price: 329,
        description: 'Organic quinoa with kale, avocado, and lemon-tahini dressing.',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80',
        isVeg: true,
        isAvailable: true
      },
      {
        name: 'Chicken Avocado Zen',
        category: createdCategories.find(c => c.slug === 'salads')._id,
        price: 389,
        description: 'Grilled chicken breast with fresh avocado and mixed garden greens.',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
        isVeg: false,
        isAvailable: true
      },
      // Yogurt
      {
        name: 'Greek Berry Parfait',
        category: createdCategories.find(c => c.slug === 'yogurt')._id,
        price: 189,
        description: 'Thick greek yogurt layered with honey and forest berries.',
        image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
        isVeg: true,
        isAvailable: true
      },
      {
        name: 'Granola Crunch Bowl',
        category: createdCategories.find(c => c.slug === 'yogurt')._id,
        price: 159,
        description: 'Low-fat yogurt topped with roasted oats and almond slivers.',
        image: 'https://images.unsplash.com/photo-1505252873400-019688439369?w=800&q=80',
        isVeg: true,
        isAvailable: true
      },
      // Burgers
      {
        name: 'The Beast Protein Burger',
        category: createdCategories.find(c => c.slug === 'burgers')._id,
        price: 449,
        description: 'Double lean beef patty with high-protein sourdough bun.',
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
        isVeg: false,
        isAvailable: true
      },
      {
        name: 'Grilled Tofu Burger',
        category: createdCategories.find(c => c.slug === 'burgers')._id,
        price: 349,
        description: 'Marinated firm tofu patty with spicy vegan mayo.',
        image: 'https://images.unsplash.com/photo-1584947844690-676644265538?w=800&q=80',
        isVeg: true,
        isAvailable: true
      },
      // Pizzas
      {
        name: 'Chicken Tikka Protein Pizza',
        category: createdCategories.find(c => c.slug === 'pizzas')._id,
        price: 549,
        description: 'Cauliflower crust topped with lean chicken tikka and low-fat cheese.',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
        isVeg: false,
        isAvailable: true
      },
      {
        name: 'Paneer Green Forest',
        category: createdCategories.find(c => c.slug === 'pizzas')._id,
        price: 499,
        description: 'High-fiber crust with fresh spinach, basil, and roasted paneer.',
        image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=800&q=80',
        isVeg: true,
        isAvailable: true
      },
      // Wraps
      {
        name: 'Falafel Hummus Wrap',
        category: createdCategories.find(c => c.slug === 'wraps')._id,
        price: 279,
        description: 'Crispy chickpea falafel with smooth beet hummus in whole wheat wrap.',
        image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&q=80',
        isVeg: true,
        isAvailable: true
      },
      {
        name: 'Turkey Club Protein Wrap',
        category: createdCategories.find(c => c.slug === 'wraps')._id,
        price: 319,
        description: 'Sliced lean turkey breast with egg white and lettuce.',
        image: 'https://images.unsplash.com/photo-1563231174-8db92769611f?w=800&q=80',
        isVeg: false,
        isAvailable: true
      },
      // Desserts
      {
        name: 'Zero Sugar Brownie',
        category: createdCategories.find(c => c.slug === 'desserts')._id,
        price: 149,
        description: 'Dark chocolate brownie sweetened with stevia, high in fiber.',
        image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80',
        isVeg: true,
        isAvailable: true
      },
      {
        name: 'Protein Cheesecake',
        category: createdCategories.find(c => c.slug === 'desserts')._id,
        price: 199,
        description: 'Low-calorie base with cottage cheese topping and strawberry glaze.',
        image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&q=80',
        isVeg: true,
        isAvailable: true
      },
      // Beverages
      {
        name: 'Blueberry Detox Tea',
        category: createdCategories.find(c => c.slug === 'beverages')._id,
        price: 99,
        description: 'Iced herbal tea with fresh blueberries and ginger.',
        image: 'https://images.unsplash.com/photo-1544145945-f904253db0ad?w=800&q=80',
        isVeg: true,
        isAvailable: true
      },
      {
        name: 'Nitro Cold Brew',
        category: createdCategories.find(c => c.slug === 'beverages')._id,
        price: 129,
        description: 'Smooth nitrogen-infused cold coffee for clean energy.',
        image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&q=80',
        isVeg: true,
        isAvailable: true
      }
    ];

    for (const item of itemsData) {
      await db.menuItems.create(item);
    }

    console.log(`✅ Created ${itemsData.length} menu items.`);
    console.log('✨ Seeding complete! Database is now ready for 3D Menu Rendering.');
    process.exit(0);
  } catch (error) {
    console.error('❌ SEEDING FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seedData();
