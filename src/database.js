import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database connection
const dbPath = join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize tables
db.serialize(() => {
  // Create products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // Insert some sample products for testing
  db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
    if (!err && row.count === 0) {
      const sampleProducts = [
        { name: 'Laptop', description: 'High-performance laptop for work and gaming', price: 999.99 },
        { name: 'Phone', description: 'Latest smartphone with amazing camera', price: 699.99 },
        { name: 'Headphones', description: 'Wireless noise-canceling headphones', price: 199.99 }
      ];

      const stmt = db.prepare("INSERT INTO products (name, description, price) VALUES (?, ?, ?)");
      sampleProducts.forEach(product => {
        stmt.run(product.name, product.description, product.price);
      });
      stmt.finalize();
    }
  });
});

export default db;
