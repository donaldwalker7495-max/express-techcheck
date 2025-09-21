import mysql from "mysql2/promise";
import { env } from "../../src/env.js";

let db;

export async function getDb() {
	if (!db) {
		db = await mysql.createConnection({
			host: env.MYSQL_HOST,
			port: env.MYSQL_PORT,
			user: env.MYSQL_USER,
			password: env.MYSQL_PASSWORD,
			database: env.MYSQL_DB,
		});
	}
	return db;
}

export async function resetTables() {
	const conn = await getDb();

	// Drop and recreate users table
	await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    )
  `);
	await conn.query(`TRUNCATE TABLE users`);

	// Drop and recreate products table
	await conn.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL
    )
  `);
	await conn.query(`TRUNCATE TABLE products`);
}
