const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, hasPrevPage, hasNextPage, total } = pagination;

  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Page {page} of {totalPages} &middot; {total} total transactions
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={!hasPrevPage}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-40 dark:border-gray-600"
        >
          Prev
        </button>
        {start > 1 && <span className="px-1 text-sm text-gray-400">...</span>}
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`rounded-md px-3 py-1 text-sm ${
              p === page
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700'
            }`}
          >
            {p}
          </button>
        ))}
        {end < totalPages && <span className="px-1 text-sm text-gray-400">...</span>}
        <button
          disabled={!hasNextPage}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-40 dark:border-gray-600"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
