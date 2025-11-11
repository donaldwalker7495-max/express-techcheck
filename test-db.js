import db from './src/models/db.js';

async function testConnection() {
  try {
    await db.query('SELECT 1');
    console.log('Database connection successful');
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

testConnection();