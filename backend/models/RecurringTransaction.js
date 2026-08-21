import mongoose from 'mongoose';

const recurringSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, default: 'USD' },
    category: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null }, // null = indefinite
    lastGeneratedDate: { type: Date, default: null },
    nextRunDate: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('RecurringTransaction', recurringSchema);
