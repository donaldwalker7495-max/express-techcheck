const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 6,
  message: { message: 'Too many login attempts, try again later.' }
});

module.exports = { loginLimiter };
