import { env } from "../env.js";

export function errorHandler(err, req, res, _next) {
	const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
	res.status(statusCode);
	res.json({
		message: err.message,
		stack: env.NODE_ENV === "production" ? "🥞" : err.stack,
	});
}
