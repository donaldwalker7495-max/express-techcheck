import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const pool = new Pool({
  host: env.PGHOST,
  port: env.PGPORT,
  database: env.PGDATABASE,
  user: env.PGUSER,
  password: env.PGPASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  /* eslint-disable no-console */
  if (env.NODE_ENV !== "test")
    console.log("executed query", { text, duration, rows: result.rowCount });
  /* eslint-enable no-console */
  return result;
}

export async function migrate() {
  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
  `);
}

function handleExit() {
  pool.end().catch(() => {});
}

process.on("SIGINT", handleExit);
process.on("SIGTERM", handleExit);
