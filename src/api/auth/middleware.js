const jwt = require("jsonwebtoken");
const { env } = require("../../env");

const authMiddleware = {
  verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const [bearer, token] = authHeader.split(" ");
    if (bearer !== "Bearer" || !token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }
  },
};

module.exports = authMiddleware;
