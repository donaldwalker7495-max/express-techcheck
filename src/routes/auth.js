import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {findUserByUsername,registerUser} from '../models/userModel.js';
import { verifyToken } from '../middleware/auth.js';
import { validateUser } from '../middleware/validation.js';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { request } from 'express';
config({ path: '../../.env' });
import { Router } from "express";
const router=Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: 'Too many login attempts, please try again later' },
});

router.post('/register', validateUser, async (req, res) => {
  try {
    const existing = await findUserByUsername(req.body.username);
    if (existing) return res.status(400).json({ message: 'Username already exists' });
    const user = await registerUser(req.body.username, req.body.password);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', loginLimiter, validateUser, async (req, res) => {
  try {
    const user = await findUserByUsername(req.body.username);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/protected', verifyToken, (req, res) => {
  res.json({ message: 'Protected route accessed successfully', user: req.user });
});

export default router;