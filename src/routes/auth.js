const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/register', [ body('username').notEmpty(), body('password').isLength({ min: 6 }) ], authController.register);
router.post('/login', loginLimiter, [ body('username').notEmpty(), body('password').notEmpty() ], authController.login);
router.post('/protected', authController.protected);

module.exports = router;
