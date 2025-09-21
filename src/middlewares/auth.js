import jwt from "jsonwebtoken";
export function authRequired(req, res, next) {
	const header = req.headers["authorization"];
	if (!header)
		return res.status(401).json({ error: "Missing Authorization header" });
	const [scheme, token] = header.split(" ");
	if (scheme !== "Bearer" || !token)
		return res.status(401).json({ error: "Invalid Authorization header" });
	try {
		req.user = jwt.verify(token, process.env.JWT_SECRET);
		next();
	} catch (e) {
		return res.status(401).json({ error: "Invalid or expired token" });
	}
}
