import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = { type: 'expense', amount: '', category: '', notes: '', frequency: 'monthly', startDate: '' };

const Recurring = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...emptyForm, startDate: new Date().toISOString().slice(0, 10) });
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recurring');
      setItems(res.data.data);
    } catch {
      toast.error('Failed to load recurring transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!form.category.trim() || !form.amount || Number(form.amount) <= 0) {
      toast.error('Enter a category and a positive amount');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/recurring', { ...form, amount: Number(form.amount) });
      toast.success('Recurring transaction created');
      setForm({ ...emptyForm, startDate: new Date().toISOString().slice(0, 10) });
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create recurring transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await api.put(`/recurring/${item._id}`, { isActive: !item.isActive });
      fetchItems();
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring transaction?')) return;
    try {
      await api.delete(`/recurring/${id}`);
      toast.success('Deleted');
      fetchItems();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const currency = user?.currency || 'USD';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recurring Transactions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Subscriptions and rent auto-generate as real transactions on schedule.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-6 dark:border-gray-800 dark:bg-gray-800"
      >
        <select
          className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input
          type="number"
          step="0.01"
          placeholder={`Amount (${currency})`}
          className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
        />
        <input
          placeholder="Category (e.g. Rent)"
          className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        />
        <select
          className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          value={form.frequency}
          onChange={(e) => setForm({ ...form, frequency: e.target.value })}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <input
          type="date"
          className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Add Recurring'}
        </button>
      </form>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Loading...</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400">No recurring transactions set up yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800">
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Frequency</th>
                <th className="px-4 py-3">Next Run</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                  <td className="px-4 py-3">{r.category}</td>
                  <td className="px-4 py-3 capitalize">{r.type}</td>
                  <td className={`px-4 py-3 font-medium ${r.type === 'income' ? 'text-income' : 'text-expense'}`}>
                    {currency} {r.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 capitalize">{r.frequency}</td>
                  <td className="px-4 py-3">{new Date(r.nextRunDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {r.isActive ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleActive(r)}
                      className="mr-2 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                    >
                      {r.isActive ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Recurring;
