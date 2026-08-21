const Filters = ({ filters, setFilters, onExport }) => {
  const update = (key, value) => setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-7 dark:border-gray-800 dark:bg-gray-800">
      <input
        type="text"
        placeholder="Search notes/category"
        className="col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 lg:col-span-2"
        value={filters.search}
        onChange={(e) => update('search', e.target.value)}
      />
      <select
        className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
        value={filters.type}
        onChange={(e) => update('type', e.target.value)}
      >
        <option value="">All Types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>
      <input
        type="text"
        placeholder="Category"
        className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
        value={filters.category}
        onChange={(e) => update('category', e.target.value)}
      />
      <input
        type="number"
        placeholder="Min amount"
        className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
        value={filters.minAmount}
        onChange={(e) => update('minAmount', e.target.value)}
      />
      <input
        type="number"
        placeholder="Max amount"
        className="rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
        value={filters.maxAmount}
        onChange={(e) => update('maxAmount', e.target.value)}
      />
      <div className="flex gap-2">
        <input
          type="date"
          className="w-1/2 rounded-md border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
          value={filters.startDate}
          onChange={(e) => update('startDate', e.target.value)}
        />
        <input
          type="date"
          className="w-1/2 rounded-md border border-gray-300 px-2 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
          value={filters.endDate}
          onChange={(e) => update('endDate', e.target.value)}
        />
      </div>
      <button
        onClick={onExport}
        className="col-span-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 sm:col-span-1 lg:col-span-1"
      >
        Export CSV
      </button>
    </div>
  );
};

export default Filters;
