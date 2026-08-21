import express from 'express';
import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  exportTransactionsCSV,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/auth.js';
import {
  createTransactionValidation,
  updateTransactionValidation,
  listTransactionValidation,
} from '../validators/transactionValidator.js';
import { validateRequest } from '../validators/authValidator.js';

const router = express.Router();

router.use(protect);

router.get('/export/csv', exportTransactionsCSV);

router
  .route('/')
  .get(listTransactionValidation, validateRequest, getTransactions)
  .post(createTransactionValidation, validateRequest, createTransaction);

router
  .route('/:id')
  .get(getTransaction)
  .put(updateTransactionValidation, validateRequest, updateTransaction)
  .delete(deleteTransaction);

export default router;
