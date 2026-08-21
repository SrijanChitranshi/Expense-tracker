import express from 'express';
import { registerUser, loginUser, getMe, updateMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  registerValidation,
  loginValidation,
  validateRequest,
} from '../validators/authValidator.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, registerValidation, validateRequest, registerUser);
router.post('/login', authLimiter, loginValidation, validateRequest, loginUser);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

export default router;
