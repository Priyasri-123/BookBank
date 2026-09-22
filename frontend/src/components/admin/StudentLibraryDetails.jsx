import React, { useEffect, useState } from 'react';
import { userApi } from '../../api/userApi';
import { getErrorMessage } from '../../api/axios';
import Badge from '../../components/common/Badge';

function formatDate(value) {
  if (!value) return '-';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value + 'T00:00:00').toLocaleDateString();
  }
  return new Date(value).toLocaleDateString();
}

function fmtMoney(value) {
  if (value === null || value === undefined) return '₹0.00';
  return `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function StudentLibraryDetails({ studentId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    userApi
      .getLibrarySummary(studentId)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [studentId]);

  if (loading) return <div>Loading student library details...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>Student ID: {studentId}</div>;

  const cards = [
    { label: 'Currently Borrowed', value: data.currentlyBorrowedCount, icon: '📖' },
    { label: 'Overdue Books', value: data.overdueCount, icon: '⏳' },
    { label: 'Pending Requests', value: data.pendingRequests?.length ?? 0, icon: '🔔' },
    { label: 'Active Reservations', value: data.activeReservations?.length ?? 0, icon: '📅' },
    { label: 'Current Unpaid Fine', value: fmtMoney(data.currentUnpaidFine), icon: '💰' },
    { label: 'Total Paid Fine', value: fmtMoney(data.totalPaidFine), icon: '✅' },
    { label: 'Total Borrowing Transactions', value: data.totalBorrowingTransactions, icon: '📋' },
    { label: 'Returned Books', value: data.returnedBooksCount, icon: '📚' },
  ];

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>Student Information</h2>
      <table>
        <tbody>
          <tr><th>Student ID</th><td>{data.studentId ?? studentId}</td></tr>
          <tr><th>Name</th><td>{data.studentName}</td></tr>
          <tr><th>Email</th><td>{data.studentEmail}</td></tr>
          <tr><th>Register Number</th><td>{data.studentRegisterNumber || '-'}</td></tr>
          <tr><th>Role</th><td>{data.role}</td></tr>
          <tr><th>Account Status</th><td>{data.active ? 'Active' : 'Inactive'}</td></tr>
          <tr><th>Joined Date</th><td>{formatDate(data.createdAt)}</td></tr>
        </tbody>
      </table>

      <h2 style={{ marginTop: 24, marginBottom: 16 }}>Library Summary</h2>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {cards.map((c) => (
          <div key={c.label} className="card stat-card">
            <div className="stat-value">
              <span className="stat-icon">{c.icon}</span>
              {c.value}
            </div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 24, marginBottom: 16 }}>Currently Borrowed</h2>
      <div className="card">
        {(data.currentlyBorrowed?.length ?? 0) === 0 ? (
          <p className="empty-state">No currently borrowed books</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Overdue Days</th>
                  <th>Fine Amount</th>
                  <th>Fine Paid</th>
                  <th>Fine Remaining</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {data.currentlyBorrowed.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.bookTitle}</strong>
                      {t.copyCode && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Copy: {t.copyCode}</div>
                      )}
                    </td>
                    <td><Badge status={t.status} /></td>
                    <td>{t.dueDate ? formatDate(t.dueDate) : '-'}</td>
                    <td>{t.overdueDays ?? 0}</td>
                    <td>{fmtMoney(t.fineAmount)}</td>
                    <td>{fmtMoney(t.finePaidAmount)}</td>
                    <td>{fmtMoney(t.fineAmountDue)}</td>
                    <td><Badge status={t.finePaymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2 style={{ marginTop: 24, marginBottom: 16 }}>Overdue Books</h2>
      <div className="card">
        {(data.overdueBooks?.length ?? 0) === 0 ? (
          <p className="empty-state">No overdue books</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Overdue Days</th>
                  <th>Fine Amount</th>
                  <th>Fine Paid</th>
                  <th>Fine Remaining</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {data.overdueBooks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.bookTitle}</strong>
                      {t.copyCode && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Copy: {t.copyCode}</div>
                      )}
                    </td>
                    <td><Badge status={t.status} /></td>
                    <td>{t.dueDate ? formatDate(t.dueDate) : '-'}</td>
                    <td>{t.overdueDays ?? 0}</td>
                    <td>{fmtMoney(t.fineAmount)}</td>
                    <td>{fmtMoney(t.finePaidAmount)}</td>
                    <td>{fmtMoney(t.fineAmountDue)}</td>
                    <td><Badge status={t.finePaymentStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2 style={{ marginTop: 24, marginBottom: 16 }}>Pending Requests</h2>
      <div className="card">
        {(data.pendingRequests?.length ?? 0) === 0 ? (
          <p className="empty-state">No pending requests</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Copy Code</th>
                  <th>Request Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingRequests.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.bookTitle}</strong>
                    </td>
                    <td>{t.copyCode || '-'}</td>
                    <td>{t.requestDate ? formatDate(t.requestDate) : '-'}</td>
                    <td><Badge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2 style={{ marginTop: 24, marginBottom: 16 }}>Active Reservations</h2>
      <div className="card">
        {(data.activeReservations?.length ?? 0) === 0 ? (
          <p className="empty-state">No active reservations</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Reservation Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.activeReservations.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.bookTitle}</strong>
                    </td>
                    <td>{r.reservationDate ? formatDate(r.reservationDate) : '-'}</td>
                    <td>{r.expiryDate ? formatDate(r.expiryDate) : '-'}</td>
                    <td><Badge status={r.status} /></td>
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