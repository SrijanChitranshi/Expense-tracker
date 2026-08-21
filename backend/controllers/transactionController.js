import { Parser as CsvParser } from 'json2csv';
import Transaction from '../models/Transaction.js';
import asyncHandler from '../utils/asyncHandler.js';
import { checkBudgetAlert } from './budgetController.js';

// @desc    Create a transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = asyncHandler(async (req, res) => {
  const { type, amount, category, date, notes, currency, receiptUrl } = req.body;

  // In a real multi-currency app you'd convert using a live/cached FX rate.
  // Simplified here: if no currency given, assume user's base currency (1:1).
  const amountInBaseCurrency = amount; // TODO: apply FX conversion if currency !== user.currency

  const transaction = await Transaction.create({
    user: req.user._id,
    type,
    amount,
    currency: currency || req.user.currency,
    amountInBaseCurrency,
    category,
    date: date || Date.now(),
    notes,
    receiptUrl,
  });

  // Fire-and-check budget alert (non-blocking response-wise, but awaited so
  // the client can be told immediately if this transaction breached a budget)
  const budgetAlert =
    type === 'expense' ? await checkBudgetAlert(req.user._id, category) : null;

  res.status(201).json({ success: true, data: transaction, budgetAlert });
});

// @desc    Get paginated, filterable, searchable transactions
// @route   GET /api/transactions
// @access  Private
export const getTransactions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    type,
    category,
    search,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    sortBy = 'date',
    sortOrder = 'desc',
  } = req.query;

  const filter = { user: req.user._id };

  if (type) filter.type = type;
  if (category) filter.category = category;
  if (search) {
    // Search across category and notes
    filter.$or = [
      { category: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
    ];
  }
  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort(sort).skip(skip).limit(limitNum),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: transactions,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      hasNextPage: skip + transactions.length < total,
      hasPrevPage: pageNum > 1,
    },
  });
});

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
export const getTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  res.json({ success: true, data: transaction });
});

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }

  const fields = ['type', 'amount', 'category', 'date', 'notes', 'currency', 'receiptUrl'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) transaction[f] = req.body[f];
  });
  if (req.body.amount !== undefined) {
    transaction.amountInBaseCurrency = req.body.amount; // simplified, see note above
  }

  await transaction.save();
  res.json({ success: true, data: transaction });
});

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!transaction) {
    res.status(404);
    throw new Error('Transaction not found');
  }
  res.json({ success: true, data: {} });
});

// @desc    Export transactions as CSV
// @route   GET /api/transactions/export/csv
// @access  Private
export const exportTransactionsCSV = asyncHandler(async (req, res) => {
  const { startDate, endDate, type, category } = req.query;
  const filter = { user: req.user._id };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }

  const transactions = await Transaction.find(filter).sort({ date: -1 }).lean();

  const fields = ['date', 'type', 'category', 'amount', 'currency', 'notes'];
  const csvParser = new CsvParser({ fields });
  const csv = csvParser.parse(transactions);

  res.header('Content-Type', 'text/csv');
  res.attachment(`transactions-${Date.now()}.csv`);
  res.send(csv);
});
