import React, { useEffect, useState } from 'react';
import { borrowApi } from '../../api/borrowApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Toast from '../../components/common/Toast';
import Badge from '../../components/common/Badge';

export default function BorrowRequests() {
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('PENDING');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async (currentFilter) => {
    setLoading(true);
    try {
      const { data } = currentFilter === 'PENDING' ? await borrowApi.getPending() : await borrowApi.getAll();
      setTransactions(data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(filter); }, [filter]);

  const handleApprove = async (id) => {
    try {
      await borrowApi.approve(id);
      setToast({ type: 'success', message: 'Request approved successfully.' });
      load(filter);
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err) });
    }
  };

  const handleRejectConfirm = async () => {
    setRejecting(true);
    try {
      await borrowApi.reject(rejectTarget.id);
      setRejectTarget(null);
      setToast({ type: 'success', message: 'Request rejected.' });
      load(filter);
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setRejecting(false);
    }
  };

  const handleReturn = async (id) => {
    try {
      await borrowApi.returnBook(id);
      setToast({ type: 'success', message: 'Book marked as returned.' });
      load(filter);
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err) });
    }
  };

  return (
    <div>
      <h1 className="page-title">Borrow Requests</h1>
      <p className="page-subtitle">Approve, reject, and manage returns for borrow requests.</p>

      <div style={{ marginBottom: 16 }}>
        <button className={`btn btn-sm ${filter === 'PENDING' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter('PENDING')}>Pending</button>
        <button className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-outline'}`} style={{ marginLeft: 8 }} onClick={() => setFilter('ALL')}>All</button>
      </div>

      {error && <Alert type="error" message={error} />}
      <Toast
        type={toast?.type}
        message={toast?.message}
        onClose={() => setToast(null)}
      />

      <div className="card">
        {loading && !transactions ? <Spinner /> : transactions.length === 0 ? (
          <div className="empty-state">
            <p>{filter === 'PENDING' ? 'No pending requests.' : 'No requests to show.'}</p>
          </div>
        ) : (
          <table>
            <thead><tr><th>Student</th><th>Book</th><th>Requested</th><th>Due Date</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.userName}</td>
                  <td>{t.bookTitle}</td>
                  <td>{t.requestDate ? new Date(t.requestDate).toLocaleDateString() : '-'}</td>
                  <td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</td>
                  <td><Badge status={t.status} /></td>
                  <td>
                    {t.status === 'REQUESTED' && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => handleApprove(t.id)}>Approve</button>
                        <button className="btn btn-danger btn-sm" style={{ marginLeft: 6 }} onClick={() => setRejectTarget(t)}>Reject</button>
                      </>
                    )}
                    {(t.status === 'ISSUED' || t.status === 'OVERDUE') && (
                      <button className="btn btn-accent btn-sm" onClick={() => handleReturn(t.id)}>Mark Returned</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rejectTarget && (
        <div className="modal-overlay" onClick={() => setRejectTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Reject Request</h2>
              <button className="modal-close" onClick={() => setRejectTarget(null)} aria-label="Close">✕</button>
            </div>
            <p style={{ margin: '12px 0' }}>
              Are you sure you want to reject the request from <strong>{rejectTarget.userName}</strong> for <strong>{rejectTarget.bookTitle}</strong>?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setRejectTarget(null)} disabled={rejecting}>Cancel</button>
              <button className="btn btn-danger" onClick={handleRejectConfirm} disabled={rejecting}>
                {rejecting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
