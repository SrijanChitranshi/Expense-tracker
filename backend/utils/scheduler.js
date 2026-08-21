import cron from 'node-cron';
import RecurringTransaction from '../models/RecurringTransaction.js';
import Transaction from '../models/Transaction.js';

// Given a date and a frequency, returns the next occurrence date.
export const computeNextRunDate = (fromDate, frequency) => {
  const d = new Date(fromDate);
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      break;
  }
  return d;
};

// Finds all active recurring templates whose nextRunDate has arrived,
// generates a concrete Transaction for each, and advances nextRunDate.
// This is the "auto-generation" engine for subscriptions/rent etc.
export const runRecurringGeneration = async () => {
  const now = new Date();

  const due = await RecurringTransaction.find({
    isActive: true,
    nextRunDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
  });

  for (const template of due) {
    await Transaction.create({
      user: template.user,
      type: template.type,
      amount: template.amount,
      currency: template.currency,
      amountInBaseCurrency: template.amount,
      category: template.category,
      date: template.nextRunDate,
      notes: template.notes ? `${template.notes} (auto-generated)` : 'Auto-generated recurring transaction',
      recurring: template._id,
    });

    template.lastGeneratedDate = template.nextRunDate;
    template.nextRunDate = computeNextRunDate(template.nextRunDate, template.frequency);
    await template.save();
  }

  if (due.length) {
    console.log(`[recurring] generated ${due.length} transaction(s) at ${now.toISOString()}`);
  }
};

// Registers a daily cron job (runs at 00:05 every day) to catch due
// recurring transactions. Call once at server startup.
export const startRecurringScheduler = () => {
  cron.schedule('5 0 * * *', () => {
    runRecurringGeneration().catch((err) =>
      console.error('[recurring] generation failed:', err.message)
    );
  });

  // Also run once at boot so nothing is missed while the server was down
  runRecurringGeneration().catch((err) =>
    console.error('[recurring] initial generation failed:', err.message)
  );
};
