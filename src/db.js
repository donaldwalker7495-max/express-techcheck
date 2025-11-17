import mysql from "mysql2/promise";
import { env } from "./env.js";

let pool = null;

// Initialize pool only if essential MySQL env vars are set
if (env.MYSQL_HOST && env.MYSQL_USER && env.MYSQL_DATABASE) {
  pool = mysql.createPool({
    host: env.MYSQL_HOST,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    port: env.MYSQL_PORT || 3306,
    database: env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

export function hasDb() {
  return !!pool;
}

export async function dbQuery(sql, params = []) {
  if (!pool) throw new Error("MySQL is not configured. Set MYSQL_* env vars.");
  const [rows] = await pool.execute(sql, params);
  return rows;
}
