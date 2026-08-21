import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import TransactionForm from '../components/TransactionForm.jsx';
import TransactionList from '../components/TransactionList.jsx';
import Filters from '../components/Filters.jsx';
import Pagination from '../components/Pagination.jsx';

const defaultFilters = {
  search: '',
  type: '',
  category: '',
  minAmount: '',
  maxAmount: '',
  startDate: '',
  endDate: '',
  page: 1,
  limit: 10,
};

// Debounce hook so search/amount typing doesn't fire a request per keystroke
const useDebounced = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

const Transactions = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState(defaultFilters);
  const debouncedFilters = useDebounced(filters, 400);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(debouncedFilters).filter(([, v]) => v !== '' && v !== null)
      );
      const res = await api.get('/transactions', { params });
      setTransactions(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [debouncedFilters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Transaction deleted');
      fetchTransactions();
    } catch {
      toast.error('Failed to delete transaction');
    }
  };

  const handleExport = async () => {
    try {
      const params = {};
      ['type', 'category', 'startDate', 'endDate'].forEach((k) => {
        if (filters[k]) params[k] = filters[k];
      });
      const res = await api.get('/transactions/export/csv', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Add, edit, filter and export your transactions.</p>
      </div>

      <TransactionForm
        editing={editing}
        onDone={() => {
          setEditing(null);
          fetchTransactions();
        }}
      />

      <Filters filters={filters} setFilters={setFilters} onExport={handleExport} />

      <TransactionList
        transactions={transactions}
        loading={loading}
        onEdit={setEditing}
        onDelete={handleDelete}
        currency={user?.currency || 'USD'}
      />

      <Pagination pagination={pagination} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
    </div>
  );
};

export default Transactions;
