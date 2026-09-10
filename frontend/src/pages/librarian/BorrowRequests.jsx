import React, { useEffect, useState } from 'react';
import { borrowApi } from '../../api/borrowApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';

export default function BorrowRequests() {
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('PENDING');

  const load = async (currentFilter) => {
    try {
      const { data } = currentFilter === 'PENDING' ? await borrowApi.getPending() : await borrowApi.getAll();
      setTransactions(data);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => { load(filter); }, [filter]);

  const handleAction = async (action, id) => {
    setError('');
    setSuccess('');
    try {
      if (action === 'approve') await borrowApi.approve(id);
      if (action === 'reject') await borrowApi.reject(id);
      if (action === 'return') await borrowApi.returnBook(id);
      setSuccess('Action completed successfully.');
      load(filter);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (error && !transactions) return <Alert message={error} />;
  if (!transactions) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Borrow Requests</h1>
      <p className="page-subtitle">Approve, reject, and manage returns for borrow requests.</p>

      <div style={{ marginBottom: 16 }}>
        <button className={`btn btn-sm ${filter === 'PENDING' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('PENDING')}>Pending</button>
        <button className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-outline'}`} style={{ marginLeft: 8 }} onClick={() => setFilter('ALL')}>All</button>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="card">
        {transactions.length === 0 ? (
          <p className="empty-state">No requests to show.</p>
        ) : (
          <table>
            <thead><tr><th>Student</th><th>Book</th><th>Requested</th><th>Due Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.userName}</td>
                  <td>{t.bookTitle}</td>
                  <td>{new Date(t.requestDate).toLocaleDateString()}</td>
                  <td>{t.dueDate || '-'}</td>
                  <td><Badge status={t.status} /></td>
                  <td>
                    {t.status === 'REQUESTED' && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => handleAction('approve', t.id)}>Approve</button>
                        <button className="btn btn-danger btn-sm" style={{ marginLeft: 6 }} onClick={() => handleAction('reject', t.id)}>Reject</button>
                      </>
                    )}
                    {(t.status === 'ISSUED' || t.status === 'OVERDUE') && (
                      <button className="btn btn-accent btn-sm" onClick={() => handleAction('return', t.id)}>Mark Returned</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
