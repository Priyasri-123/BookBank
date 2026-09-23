import React, { useState } from 'react';
import { borrowApi } from '../../api/borrowApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Toast from '../../components/common/Toast';
import Badge from '../../components/common/Badge';

const FILTERS = [
  { label: 'All', value: 'ALL' },
  { label: 'Unpaid', value: 'UNPAID' },
  { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Overdue', value: 'OVERDUE' },
];

const fmtMoney = (v) => {
  if (v === null || v === undefined) return '₹0.00';
  return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (v) => {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function AdminFineManagement() {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const load = (currentFilter = filter, currentKeyword = keyword) => {
    setLoading(true);
    setError('');
    borrowApi.getAdminFines(currentFilter, currentKeyword)
      .then((res) => { setRows(res.data); })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  // Load on mount only (filter/keyword changes trigger explicit search)
  React.useEffect(() => { load('ALL', ''); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(filter, keyword);
  };

  const handleFilter = (f) => {
    setFilter(f);
    load(f, keyword);
  };

  return (
    <div>
      <h1 className="page-title">Fine Management</h1>
      <p className="page-subtitle">Review borrowing fines, payments, and outstanding balances.</p>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => handleFilter(f.value)}
            disabled={loading}
          >
            {f.label}
          </button>
        ))}
      </div>

      <form className="search-bar" onSubmit={handleSearch} style={{ marginBottom: 16 }}>
        <input
          placeholder="Search by student name, email, register number, or book title..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button className="btn btn-primary" disabled={loading}>Search</button>
      </form>

      {error && <Alert type="error" message={error} />}
      <Toast
        type={toast?.type}
        message={toast?.message}
        onClose={() => setToast(null)}
      />

      <div className="card">
        {rows === null ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <p>No fine records found{filter !== 'ALL' ? ' for the selected filter' : ''}.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Register No.</th>
                  <th>Book</th>
                  <th>Copy</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Overdue Days</th>
                  <th>Fine</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id}>
                    <td>{t.userName || '-'}</td>
                    <td>{t.userEmail || '-'}</td>
                    <td>{t.userRegisterNumber || '-'}</td>
                    <td>{t.bookTitle || '-'}</td>
                    <td>{t.copyCode || '-'}</td>
                    <td>{fmtDate(t.issueDate)}</td>
                    <td>{fmtDate(t.dueDate)}</td>
                    <td>{t.overdueDays ?? 0}</td>
                    <td>{fmtMoney(t.fineAmount)}</td>
                    <td>{fmtMoney(t.finePaidAmount)}</td>
                    <td>{fmtMoney(t.fineAmountDue)}</td>
                    <td>
                      <Badge status={t.finePaymentStatus || 'NONE'} />
                    </td>
                    <td><Badge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}