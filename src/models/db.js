import mysql from 'mysql2';
import { config } from 'dotenv';

config({ path: '../../.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default pool.promise();