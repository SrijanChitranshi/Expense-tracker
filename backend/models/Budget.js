import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: { type: String, required: true, trim: true },
    limit: { type: Number, required: true, min: 0 },
    period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    alertThresholdPercent: { type: Number, default: 80 }, // warn at 80% of limit
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, category: 1, period: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);
