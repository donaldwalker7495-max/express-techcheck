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
    SELECT pg_advisory_lock(424242);

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

    CREATE TABLE IF NOT EXISTS login_attempts (
      id BIGSERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      attempt_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      success BOOLEAN NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_login_attempts_username_time ON login_attempts(username, attempt_time DESC);

    SELECT pg_advisory_unlock(424242);
  `);
}

function handleExit() {
  pool.end().catch(() => {});
}

process.on("SIGINT", handleExit);
process.on("SIGTERM", handleExit);
