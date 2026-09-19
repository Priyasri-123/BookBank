import React, { useEffect, useState } from 'react';
import { borrowApi } from '../../api/borrowApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';

export default function BorrowingHistory() {
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    borrowApi.getMyHistory()
      .then((res) => setTransactions(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const fmtDate = (v) => {
    if (!v) return '-';
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      return new Date(v + 'T00:00:00').toLocaleDateString();
    }
    return new Date(v).toLocaleDateString();
  };

  const fmt = (n) => {
    const v = Number(n) || 0;
    return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (error) return <Alert message={error} />;
  if (!transactions) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Borrowing History</h1>
      <p className="page-subtitle">All your past and current borrow requests.</p>
      <div className="card">
        {transactions.length === 0 ? (
          <p className="empty-state">No borrowing history yet.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Requested</th>
                  <th>Due Date</th>
                  <th>Returned</th>
                  <th>Status</th>
                  <th>Overdue</th>
                  <th>Fine</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className={t.overdueDays > 0 ? 'overdue-row' : ''}>
                    <td>
                      <strong>{t.bookTitle}</strong>
                      {t.copyCode && <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Copy: {t.copyCode}</div>}
                    </td>
                    <td>{t.requestDate ? fmtDate(t.requestDate) : '-'}</td>
                    <td>{t.dueDate ? fmtDate(t.dueDate) : '-'}</td>
                    <td>{t.returnDate ? fmtDate(t.returnDate) : '-'}</td>
                    <td><Badge status={t.status} /></td>
                    <td>
                      {t.overdueDays > 0 ? (
                        <span style={{color: 'var(--danger)', fontWeight: 600}}>{t.overdueDays} day(s)</span>
                      ) : (
                        <span style={{color: 'var(--success)'}}>On time</span>
                      )}
                    </td>
                    <td>
                      {t.fineAmount && t.fineAmount > 0 ? (
                        <>
                          <div>₹{fmt(t.fineAmount)}</div>
                          {t.finePerDay && t.overdueDays > 0 && (
                            <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>
                              ₹{fmt(t.finePerDay)}/day × {t.overdueDays} day(s)
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{color: 'var(--success)'}}>₹0.00</span>
                      )}
                    </td>
                    <td>
                      {t.finePaid ? (
                        <div>
                          <div className="badge badge-paid" style={{fontSize: '0.75rem', padding: '4px 8px', marginBottom: 4}}>Paid</div>
                          {t.finePaymentTxnId && (
                            <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>
                              Txn: {t.finePaymentTxnId}
                            </div>
                          )}
                          {t.finePaymentDate && (
                            <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>
                              {new Date(t.finePaymentDate).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ) : t.fineAmount && t.fineAmount > 0 ? (
                        <span style={{color: 'var(--warning)', fontWeight: 600}}>Unpaid</span>
                      ) : (
                        <span style={{color: 'var(--success)'}}>—</span>
                      )}
                    </td>
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
