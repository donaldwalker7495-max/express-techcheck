import jwt from "jsonwebtoken";
import { env } from "./env.js";

export function notFound(req, res, next) {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
}

export function errorHandler(err, req, res, _next) {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
}

export function authenticateJwt(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401);
      throw new Error("Missing or invalid Authorization header");
    }
    const token = authHeader.substring("Bearer ".length);
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload;
    next();
  }
  catch (err) {
    res.status(401);
    next(new Error("Invalid or expired token"));
  }
}
