import React from 'react';

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="pagination">
      <button className="btn btn-outline btn-sm" disabled={page === 0} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span style={{ alignSelf: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        Page {page + 1} of {totalPages}
      </span>
      <button className="btn btn-outline btn-sm" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}
