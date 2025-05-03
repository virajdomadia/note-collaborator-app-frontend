// src/components/Pagination.jsx
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex justify-center space-x-2 mt-4">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
        disabled={currentPage === 1}
      >
        Prev
      </button>
      <span className="self-center">
        {currentPage} / {totalPages}
      </span>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
        disabled={currentPage === totalPages}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
