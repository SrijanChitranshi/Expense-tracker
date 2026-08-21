import mongoose from 'mongoose';
import Transaction from '../models/Transaction.js';
import asyncHandler from '../utils/asyncHandler.js';

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

// @desc    Dashboard summary: total income, total expense, balance
//          (optionally scoped to a date range)
// @route   GET /api/analytics/summary
// @access  Private
export const getSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const match = { user: toObjectId(req.user._id) };
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }

  // $facet lets us compute income totals and expense totals in a single
  // round trip to Mongo instead of two separate queries.
  const result = await Transaction.aggregate([
    { $match: match },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: '$type',
              total: { $sum: '$amountInBaseCurrency' },
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const totals = result[0].totals;
  const income = totals.find((t) => t._id === 'income')?.total || 0;
  const expense = totals.find((t) => t._id === 'expense')?.total || 0;
  const incomeCount = totals.find((t) => t._id === 'income')?.count || 0;
  const expenseCount = totals.find((t) => t._id === 'expense')?.count || 0;

  res.json({
    success: true,
    data: {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      incomeCount,
      expenseCount,
    },
  });
});

// @desc    Category breakdown (for pie chart) - expenses by category
// @route   GET /api/analytics/category-breakdown
// @access  Private
export const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const { startDate, endDate, type = 'expense' } = req.query;

  const match = { user: toObjectId(req.user._id), type };
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }

  const breakdown = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amountInBaseCurrency' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
    {
      $project: {
        _id: 0,
        category: '$_id',
        total: 1,
        count: 1,
      },
    },
  ]);

  res.json({ success: true, data: breakdown });
});

// @desc    Monthly trend (for line/bar chart) - income vs expense per month
// @route   GET /api/analytics/monthly-trend?year=2026
// @access  Private
export const getMonthlyTrend = asyncHandler(async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;

  const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
  const endOfYear = new Date(`${Number(year) + 1}-01-01T00:00:00.000Z`);

  const trend = await Transaction.aggregate([
    {
      $match: {
        user: toObjectId(req.user._id),
        date: { $gte: startOfYear, $lt: endOfYear },
      },
    },
    {
      $group: {
        _id: { month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amountInBaseCurrency' },
      },
    },
    {
      $group: {
        _id: '$_id.month',
        breakdown: { $push: { type: '$_id.type', total: '$total' } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Normalize into a full 12-month array with income/expense/balance
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthData = trend.find((t) => t._id === i + 1);
    const income = monthData?.breakdown.find((b) => b.type === 'income')?.total || 0;
    const expense = monthData?.breakdown.find((b) => b.type === 'expense')?.total || 0;
    return {
      month: i + 1,
      income,
      expense,
      balance: income - expense,
    };
  });

  res.json({ success: true, data: months });
});

// @desc    Yearly summary (income/expense per year, for multi-year overview)
// @route   GET /api/analytics/yearly-summary
// @access  Private
export const getYearlySummary = asyncHandler(async (req, res) => {
  const summary = await Transaction.aggregate([
    { $match: { user: toObjectId(req.user._id) } },
    {
      $group: {
        _id: { year: { $year: '$date' }, type: '$type' },
        total: { $sum: '$amountInBaseCurrency' },
      },
    },
    {
      $group: {
        _id: '$_id.year',
        breakdown: { $push: { type: '$_id.type', total: '$total' } },
      },
    },
    { $sort: { _id: -1 } },
    {
      $project: {
        _id: 0,
        year: '$_id',
        income: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $map: {
                    input: { $filter: { input: '$breakdown', cond: { $eq: ['$$this.type', 'income'] } } },
                    as: 'i',
                    in: '$$i.total',
                  },
                },
                0,
              ],
            },
            0,
          ],
        },
        expense: {
          $ifNull: [
            {
              $arrayElemAt: [
                {
                  $map: {
                    input: { $filter: { input: '$breakdown', cond: { $eq: ['$$this.type', 'expense'] } } },
                    as: 'e',
                    in: '$$e.total',
                  },
                },
                0,
              ],
            },
            0,
          ],
        },
      },
    },
  ]);

  res.json({ success: true, data: summary });
});
