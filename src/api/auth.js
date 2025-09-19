import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod/v4";

import { env } from "../env.js";
import { query } from "../db.js";
import { authenticateJwt } from "../middlewares.js";

const router = express.Router();

const registerSchema = z.object({
  username: z.string().min(3).max(255),
  password: z.string().min(8).max(1024),
});

const loginSchema = z.object({
  username: z.string().min(1).max(255),
  password: z.string().min(1).max(2048),
});

async function recordLoginAttempt(username, success) {
  try {
    await query("INSERT INTO login_attempts (username, success) VALUES ($1, $2)", [username, success]);
  }
  catch {
    // ignore logging errors
  }
}

async function isRateLimited(username) {
  const windowMs = env.RATE_LIMIT_WINDOW_MS;
  const maxAttempts = env.RATE_LIMIT_MAX_ATTEMPTS;
  const { rows } = await query(
    `SELECT COUNT(*)::int AS attempts
     FROM login_attempts
     WHERE username = $1
       AND attempt_time >= NOW() - ($2::int || ' milliseconds')::interval
       AND success = FALSE`,
    [username, windowMs],
  );
  return rows[0].attempts >= maxAttempts;
}

router.post("/register", async (req, res, next) => {
  try {
    const { username, password } = registerSchema.parse(req.body);
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    const { rows } = await query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at",
      [username, passwordHash],
    );
    res.status(201).json(rows[0]);
  }
  catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400);
      return next(new Error(err.issues.map(i => i.message).join(", ")));
    }
    if (err && err.code === "23505") { // unique_violation
      res.status(409);
      return next(new Error("Username already exists"));
    }
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400);
      return next(new Error(parsed.error.issues.map(i => i.message).join(", ")));
    }
    const { username, password } = parsed.data;

    if (await isRateLimited(username)) {
      res.status(429);
      return next(new Error("Too many failed login attempts. Please try again later."));
    }

    const { rows } = await query("SELECT id, username, password_hash FROM users WHERE username = $1", [username]);
    if (rows.length === 0) {
      await recordLoginAttempt(username, false);
      res.status(401);
      throw new Error("Invalid credentials");
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await recordLoginAttempt(username, false);
      res.status(401);
      throw new Error("Invalid credentials");
    }

    await recordLoginAttempt(username, true);

    const payload = { sub: user.id, username: user.username };
    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
    res.json({ token });
  }
  catch (err) {
    next(err);
  }
});

router.post("/protected", authenticateJwt, async (_req, res) => {
  res.json({ ok: true });
});

export default router;


