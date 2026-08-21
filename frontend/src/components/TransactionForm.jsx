import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';

const CATEGORIES = {
  expense: ['Food', 'Rent', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'],
  income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
};

const emptyForm = { type: 'expense', amount: '', category: 'Food', date: '', notes: '' };

const TransactionForm = ({ editing, onDone }) => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editing) {
      setForm({
        type: editing.type,
        amount: editing.amount,
        category: editing.category,
        date: editing.date?.slice(0, 10) || '',
        notes: editing.notes || '',
      });
    } else {
      setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    }
  }, [editing]);

  const validate = () => {
    const e = {};
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter a positive amount';
    if (!form.category) e.category = 'Category is required';
    if (!form.date) e.date = 'Date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const uploadReceiptIfAny = async () => {
    if (!receiptFile) return undefined;
    const fd = new FormData();
    fd.append('receipt', receiptFile);
    const res = await api.post('/uploads/receipt', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data.url;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const receiptUrl = await uploadReceiptIfAny();
      const payload = { ...form, amount: Number(form.amount), ...(receiptUrl && { receiptUrl }) };

      if (editing) {
        await api.put(`/transactions/${editing._id}`, payload);
        toast.success('Transaction updated');
      } else {
        const res = await api.post('/transactions', payload);
        toast.success('Transaction added');
        if (res.data.budgetAlert?.exceeded) {
          toast.error(
            `Budget exceeded for ${res.data.budgetAlert.category}! Spent ${res.data.budgetAlert.spent.toFixed(2)} / ${res.data.budgetAlert.limit}`
          );
        } else if (res.data.budgetAlert?.nearLimit) {
          toast(`Heads up: ${res.data.budgetAlert.category} is at ${res.data.budgetAlert.percentUsed}% of budget`, {
            icon: '⚠️',
          });
        }
      }
      setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
      setReceiptFile(null);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-6 dark:border-gray-800 dark:bg-gray-800"
    >
      <select
        className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
        value={form.type}
        onChange={(e) => setForm({ ...form, type: e.target.value, category: CATEGORIES[e.target.value][0] })}
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
      </select>

      <div>
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          className="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
      </div>

      <select
        className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
      >
        {CATEGORIES[form.type].map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <input
        type="date"
        className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
      />

      <input
        type="text"
        placeholder="Notes (optional)"
        className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />

      <input
        type="file"
        accept="image/*"
        className="rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700"
        onChange={(e) => setReceiptFile(e.target.files[0])}
      />

      <div className="col-span-full flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : editing ? 'Update Transaction' : 'Add Transaction'}
        </button>
        {editing && (
          <button type="button" onClick={onDone} className="rounded-md bg-gray-200 px-4 py-2 dark:bg-gray-700">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default TransactionForm;
