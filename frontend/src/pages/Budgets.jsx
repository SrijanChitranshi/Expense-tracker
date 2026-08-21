import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const Budgets = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: '', limit: '', period: 'monthly', alertThresholdPercent: 80 });
  const [submitting, setSubmitting] = useState(false);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/budgets');
      setBudgets(res.data.data);
    } catch {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!form.category.trim() || !form.limit || Number(form.limit) <= 0) {
      toast.error('Enter a category and a positive limit');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/budgets', { ...form, limit: Number(form.limit) });
      toast.success('Budget saved');
      setForm({ category: '', limit: '', period: 'monthly', alertThresholdPercent: 80 });
      fetchBudgets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      toast.success('Budget deleted');
      fetchBudgets();
    } catch {
      toast.error('Failed to delete budget');
    }
  };

  const currency = user?.currency || 'USD';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Budgets</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set spending limits per category and get alerted when you're close to or over.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5 dark:border-gray-800 dark:bg-gray-800"
      >
        <input
          placeholder="Category (e.g. Food)"
          className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <input
          type="number"
          placeholder={`Limit (${currency})`}
          className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          value={form.limit}
          onChange={(e) => setForm({ ...form, limit: e.target.value })}
        />
        <select
          className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          value={form.period}
          onChange={(e) => setForm({ ...form, period: e.target.value })}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <input
          type="number"
          min="1"
          max="100"
          placeholder="Alert at %"
          className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          value={form.alertThresholdPercent}
          onChange={(e) => setForm({ ...form, alertThresholdPercent: e.target.value })}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save Budget'}
        </button>
      </form>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Loading budgets...</p>
      ) : budgets.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">No budgets set yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => {
            const pct = Math.min(100, b.status?.percentUsed || 0);
            const exceeded = b.status?.exceeded;
            const near = b.status?.nearLimit;
            return (
              <div
                key={b._id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">{b.category}</h3>
                  <button
                    onClick={() => handleDelete(b._id)}
                    className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{b.period} limit</p>
                <p className="mt-1 text-lg font-bold">
                  {currency} {(b.status?.spent || 0).toFixed(2)}{' '}
                  <span className="text-sm font-normal text-gray-400">/ {b.limit.toFixed(2)}</span>
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full rounded-full ${
                      exceeded ? 'bg-red-600' : near ? 'bg-amber-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {exceeded && (
                  <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                    ⚠ Budget exceeded by {currency} {((b.status?.spent || 0) - b.limit).toFixed(2)}
                  </p>
                )}
                {!exceeded && near && (
                  <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                    ⚠ Approaching limit ({b.status?.percentUsed}% used)
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Budgets;
