const TransactionList = ({ transactions, loading, onEdit, onDelete, currency }) => {
  if (loading) {
    return <p className="py-10 text-center text-sm text-gray-400">Loading transactions...</p>;
  }

  if (!transactions.length) {
    return <p className="py-10 text-center text-sm text-gray-400">No transactions found. Add one above!</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-800">
      <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3 hidden md:table-cell">Notes</th>
            <th className="px-4 py-3 hidden lg:table-cell">Receipt</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {transactions.map((t) => (
            <tr key={t._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40">
              <td className="whitespace-nowrap px-4 py-3">{new Date(t.date).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    t.type === 'income'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  }`}
                >
                  {t.type}
                </span>
              </td>
              <td className="px-4 py-3">{t.category}</td>
              <td className={`px-4 py-3 font-medium ${t.type === 'income' ? 'text-income' : 'text-expense'}`}>
                {t.type === 'income' ? '+' : '-'}
                {currency} {t.amount.toFixed(2)}
              </td>
              <td className="hidden max-w-[200px] truncate px-4 py-3 text-gray-500 md:table-cell dark:text-gray-400">
                {t.notes || '—'}
              </td>
              <td className="hidden px-4 py-3 lg:table-cell">
                {t.receiptUrl ? (
                  <a href={t.receiptUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline dark:text-indigo-400">
                    View
                  </a>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(t)}
                  className="mr-2 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(t._id)}
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
  );
};

export default TransactionList;
