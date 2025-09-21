import rateLimit from "express-rate-limit";

export const limiter = rateLimit({
	windowMs: parseInt(process.env.RATE_WINDOW_MS || "60000", 10),
	max: parseInt(process.env.RATE_MAX || "60", 10),
});
