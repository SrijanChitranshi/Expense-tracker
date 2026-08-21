import { body, query } from 'express-validator';

export const createTransactionValidation = [
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be income or expense'),
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('date').optional().isISO8601().withMessage('Date must be a valid date'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes too long'),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }),
];

export const updateTransactionValidation = [
  body('type').optional().isIn(['income', 'expense']),
  body('amount').optional().isFloat({ gt: 0 }),
  body('category').optional().trim().notEmpty(),
  body('date').optional().isISO8601(),
  body('notes').optional().isLength({ max: 500 }),
];

export const listTransactionValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['income', 'expense']),
  query('minAmount').optional().isFloat({ min: 0 }),
  query('maxAmount').optional().isFloat({ min: 0 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
];
