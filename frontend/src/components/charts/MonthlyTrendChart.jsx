import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MonthlyTrendChart = ({ data }) => {
  const chartData = (data || []).map((d) => ({
    name: MONTH_LABELS[d.month - 1],
    Income: d.income,
    Expense: d.expense,
    Balance: d.balance,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Legend />
        <Bar dataKey="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Expense" fill="#dc2626" radius={[4, 4, 0, 0]} />
        <Line type="monotone" dataKey="Balance" stroke="#6366f1" strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default MonthlyTrendChart;
