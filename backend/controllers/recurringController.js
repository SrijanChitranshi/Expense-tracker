import RecurringTransaction from '../models/RecurringTransaction.js';
import asyncHandler from '../utils/asyncHandler.js';
import { computeNextRunDate } from '../utils/scheduler.js';

// @desc    Create a recurring transaction (e.g. rent, subscription)
// @route   POST /api/recurring
// @access  Private
export const createRecurring = asyncHandler(async (req, res) => {
  const { type, amount, category, notes, frequency, startDate, endDate, currency } =
    req.body;

  const start = startDate ? new Date(startDate) : new Date();

  const recurring = await RecurringTransaction.create({
    user: req.user._id,
    type,
    amount,
    category,
    notes,
    frequency,
    startDate: start,
    endDate: endDate || null,
    currency: currency || req.user.currency,
    nextRunDate: start, // first occurrence generated on/after start date
  });

  res.status(201).json({ success: true, data: recurring });
});

// @desc    List recurring transactions
// @route   GET /api/recurring
// @access  Private
export const getRecurring = asyncHandler(async (req, res) => {
  const items = await RecurringTransaction.find({ user: req.user._id }).sort({
    nextRunDate: 1,
  });
  res.json({ success: true, data: items });
});

// @desc    Update a recurring transaction (e.g. pause/resume, change amount)
// @route   PUT /api/recurring/:id
// @access  Private
export const updateRecurring = asyncHandler(async (req, res) => {
  const recurring = await RecurringTransaction.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!recurring) {
    res.status(404);
    throw new Error('Recurring transaction not found');
  }

  const fields = ['type', 'amount', 'category', 'notes', 'frequency', 'endDate', 'isActive'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) recurring[f] = req.body[f];
  });

  if (req.body.frequency) {
    recurring.nextRunDate = computeNextRunDate(
      recurring.lastGeneratedDate || recurring.startDate,
      recurring.frequency
    );
  }

  await recurring.save();
  res.json({ success: true, data: recurring });
});

// @desc    Delete a recurring transaction
// @route   DELETE /api/recurring/:id
// @access  Private
export const deleteRecurring = asyncHandler(async (req, res) => {
  const recurring = await RecurringTransaction.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!recurring) {
    res.status(404);
    throw new Error('Recurring transaction not found');
  }
  res.json({ success: true, data: {} });
});
