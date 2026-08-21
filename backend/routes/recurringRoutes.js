import express from 'express';
import {
  createRecurring,
  getRecurring,
  updateRecurring,
  deleteRecurring,
} from '../controllers/recurringController.js';
import { protect } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validateRequest } from '../validators/authValidator.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getRecurring)
  .post(
    [
      body('type').isIn(['income', 'expense']),
      body('amount').isFloat({ gt: 0 }),
      body('category').trim().notEmpty(),
      body('frequency').isIn(['daily', 'weekly', 'monthly', 'yearly']),
    ],
    validateRequest,
    createRecurring
  );

router.route('/:id').put(updateRecurring).delete(deleteRecurring);

export default router;
