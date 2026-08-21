import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than 0'],
    },
    currency: { type: String, default: 'USD' },
    // amount converted to the user's base currency at time of entry,
    // so aggregation/summary queries don't need live FX lookups
    amountInBaseCurrency: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    date: { type: Date, required: true, default: Date.now, index: true },
    notes: { type: String, trim: true, maxlength: 500 },
    receiptUrl: { type: String, default: null },
    recurring: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecurringTransaction',
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index to speed up the common query pattern:
// find a user's transactions sorted by date, optionally filtered by category/type
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, type: 1 });

export default mongoose.model('Transaction', transactionSchema);
