const path = require('path');
const db = require('./utils/localDb');

console.log('Testing localDb...');
db.init();

const testUser = async () => {
  try {
    const user = await db.users.create({ name: 'Test', email: 'test@example.com' });
    console.log('Created User:', user);
    
    const found = await db.users.findOne({ email: 'test@example.com' });
    console.log('Found User:', found);
  } catch (err) {
    console.error('Error during test:', err);
  }
};

testUser();
