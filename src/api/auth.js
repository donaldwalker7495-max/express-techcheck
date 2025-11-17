import express from "express";
import { body, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

import { env } from "../env.js";

const router = express.Router();

// In-memory user store: { id, username, passwordHash }
let users = [];
let nextUserId = 1;

// Helpers
const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "Validation failed", details: errors.array() });
    }
    next();
  },
];

function generateToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1h" });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [, token] = authHeader.split(" ");
  if (!token) return res.status(401).json({ error: "Missing token" });
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  }
  catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Rate limiter for login: e.g., 5 attempts per 10 minutes per IP+username
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // don't count successful logins
  keyGenerator: (req, _res) => `${req.ip}:${req.body?.username || ""}`,
  handler: (_req, res) => {
    return res.status(429).json({ error: "Too many login attempts. Please try again later." });
  },
});

// POST /api/v1/auth/register
router.post(
  "/register",
  validate([
    body("username").isString().trim().notEmpty().withMessage("username is required"),
    body("password").isString().isLength({ min: 6 }).withMessage("password must be at least 6 chars"),
  ]),
  async (req, res) => {
    const { username, password } = req.body;
    const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (exists) return res.status(409).json({ error: "Username is already taken" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = { id: nextUserId++, username, passwordHash };
    users.push(user);

    res.status(201).json({ id: user.id, username: user.username });
  },
);

// POST /api/v1/auth/login
router.post(
  "/login",
  loginLimiter,
  validate([
    body("username").isString().trim().notEmpty(),
    body("password").isString().notEmpty(),
  ]),
  async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken({ sub: user.id, username: user.username });
    res.json({ token });
  },
);

// POST /api/v1/auth/protected
router.post("/protected", authMiddleware, (req, res) => {
  res.json({ message: "You have access", user: req.user });
});

export default router;
