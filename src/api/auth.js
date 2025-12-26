import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import db from '../database.js';

const router = express.Router();

// JWT secret - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Validation schemas
const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters')
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login requests per windowMs
  message: {
    error: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

// POST /api/auth/register - Register new user
router.post('/register', (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    db.get('SELECT id FROM users WHERE username = ?', [validatedData.username], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (row) {
        return res.status(409).json({ error: 'Username already exists' });
      }

      // Hash password
      bcrypt.hash(validatedData.password, 10, (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to hash password' });
        }

        // Insert new user
        const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
        stmt.run(validatedData.username, hashedPassword, function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create user' });
          }
          
          res.status(201).json({
            message: 'User registered successfully',
            user: {
              id: this.lastID,
              username: validatedData.username
            }
          });
        });
        stmt.finalize();
      });
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login - Login user
router.post('/login', loginLimiter, (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Find user
    db.get('SELECT * FROM users WHERE username = ?', [validatedData.username], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      // Check password
      bcrypt.compare(validatedData.password, user.password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({ error: 'Authentication error' });
        }
        
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: user.id, 
            username: user.username 
          }, 
          JWT_SECRET, 
          { expiresIn: '24h' }
        );

        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username
          }
        });
      });
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.errors
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/protected - Protected route example
router.post('/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'This is a protected route!',
    user: {
      id: req.user.userId,
      username: req.user.username
    },
    timestamp: new Date().toISOString()
  });
});

// GET /api/auth/profile - Get user profile (bonus protected route)
router.get('/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, username FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: user
    });
  });
});

export default router;
