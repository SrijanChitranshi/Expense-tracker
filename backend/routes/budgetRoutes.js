import express from 'express';
import { upsertBudget, getBudgets, deleteBudget } from '../controllers/budgetController.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validateRequest } from '../validators/authValidator.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getBudgets)
  .post(
    [
      body('category').trim().notEmpty().withMessage('Category is required'),
      body('limit').isFloat({ gt: 0 }).withMessage('Limit must be a positive number'),
      body('period').optional().isIn(['monthly', 'yearly']),
    ],
    validateRequest,
    upsertBudget
  );

router.delete('/:id', deleteBudget);

export default router;
