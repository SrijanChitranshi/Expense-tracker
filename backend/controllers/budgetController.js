import mongoose from 'mongoose';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import asyncHandler from '../utils/asyncHandler.js';

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const getCurrentPeriodRange = (period) => {
  const now = new Date();
  if (period === 'yearly') {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear() + 1, 0, 1),
    };
  }
  // monthly (default)
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
};

// Shared helper: checks whether spend in `category` for the current period
// has crossed the budget's alert threshold or hard limit. Used both by the
// transaction controller (real-time alert on create) and the budgets list.
export const checkBudgetAlert = async (userId, category) => {
  const budget = await Budget.findOne({ user: userId, category });
  if (!budget) return null;

  const { start, end } = getCurrentPeriodRange(budget.period);

  const [result] = await Transaction.aggregate([
    {
      $match: {
        user: toObjectId(userId),
        category,
        type: 'expense',
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: null, spent: { $sum: '$amountInBaseCurrency' } } },
  ]);

  const spent = result?.spent || 0;
  const percentUsed = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;

  return {
    category,
    limit: budget.limit,
    spent,
    percentUsed: Math.round(percentUsed * 10) / 10,
    exceeded: spent > budget.limit,
    nearLimit: percentUsed >= budget.alertThresholdPercent && spent <= budget.limit,
  };
};

// @desc    Create or update a budget for a category
// @route   POST /api/budgets
// @access  Private
export const upsertBudget = asyncHandler(async (req, res) => {
  const { category, limit, period = 'monthly', alertThresholdPercent = 80 } = req.body;

  const budget = await Budget.findOneAndUpdate(
    { user: req.user._id, category, period },
    { limit, alertThresholdPercent },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(201).json({ success: true, data: budget });
});

// @desc    Get all budgets with current spend/alert status
// @route   GET /api/budgets
// @access  Private
export const getBudgets = asyncHandler(async (req, res) => {
  const budgets = await Budget.find({ user: req.user._id });

  const withStatus = await Promise.all(
    budgets.map(async (b) => {
      const status = await checkBudgetAlert(req.user._id, b.category);
      return { ...b.toObject(), status };
    })
  );

  res.json({ success: true, data: withStatus });
});

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
export const deleteBudget = asyncHandler(async (req, res) => {
  const budget = await Budget.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!budget) {
    res.status(404);
    throw new Error('Budget not found');
  }
  res.json({ success: true, data: {} });
});
