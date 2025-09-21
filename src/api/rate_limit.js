import rateLimit from "express-rate-limit";
import { env } from "../env";

export const limiter = rateLimit({
	windowMs: parseInt(env.RATE_WINDOW_MS || "60000", 10),
	max: parseInt(env.RATE_MAX || "60", 10),
});
