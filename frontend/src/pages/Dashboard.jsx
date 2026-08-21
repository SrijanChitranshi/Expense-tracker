import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import CategoryPieChart from '../components/charts/CategoryPieChart.jsx';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const SummaryCard = ({ label, value, currency, tone }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800">
    <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    <p className={`mt-1 text-2xl font-bold ${tone}`}>
      {currency} {value.toFixed(2)}
    </p>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [summaryRes, catRes, trendRes] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/category-breakdown', { params: { type: 'expense' } }),
          api.get('/analytics/monthly-trend', { params: { year } }),
        ]);
        setSummary(summaryRes.data.data);
        setCategoryData(catRes.data.data);
        setTrendData(trendRes.data.data);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [year]);

  const currency = user?.currency || 'USD';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Welcome back, {user?.name}. Here's your financial overview.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Income" value={summary.totalIncome} currency={currency} tone="text-income" />
        <SummaryCard label="Total Expense" value={summary.totalExpense} currency={currency} tone="text-expense" />
        <SummaryCard
          label="Running Balance"
          value={summary.balance}
          currency={currency}
          tone={summary.balance >= 0 ? 'text-income' : 'text-expense'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800">
          <h2 className="mb-2 font-semibold">Expense Breakdown by Category</h2>
          {loading ? <ChartSkeleton /> : <CategoryPieChart data={categoryData} />}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Monthly Trend</h2>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
            >
              {[year - 2, year - 1, year].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          {loading ? <ChartSkeleton /> : <MonthlyTrendChart data={trendData} />}
        </div>
      </div>
    </div>
  );
};

const ChartSkeleton = () => (
  <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">Loading chart...</div>
);

export default Dashboard;
