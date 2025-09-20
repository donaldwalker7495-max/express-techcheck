const express = require("express");
const { rateLimit } = require("express-rate-limit");
const authController = require("./controller");
const authValidation = require("./validation");
const { verifyToken } = require("./middleware");

const router = express.Router();

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  message: {
    error: "Too many login attempts, please try again after 15 minutes",
  },
});

router.post("/register", authValidation.register, authController.register);
router.post("/login", authLimiter, authValidation.login, authController.login);
router.post("/protected", verifyToken, authController.protectedRoute);

module.exports = router;
