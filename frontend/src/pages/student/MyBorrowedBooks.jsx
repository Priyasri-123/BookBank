import React, { useEffect, useState } from 'react';
import { borrowApi } from '../../api/borrowApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Toast from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import FinePaymentModal from '../../components/student/FinePaymentModal';
import ReturnBookModal from '../../components/student/ReturnBookModal';

export default function MyBorrowedBooks() {
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState('');
  const [payingFine, setPayingFine] = useState(null);
  const [returningBook, setReturningBook] = useState(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = () => {
    borrowApi.getMyCurrent()
      .then((res) => setTransactions(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  };

  const handleReturnClick = (transaction) => {
    setReturnTarget(transaction);
    setReturnModalOpen(true);
  };

  const handleReturnClose = () => {
    setReturnModalOpen(false);
    setReturnTarget(null);
  };

  const handleReturnConfirm = async () => {
    if (!returnTarget) return;
    setReturningBook(returnTarget.id);
    try {
      await borrowApi.returnBook(returnTarget.id);
      setReturningBook(null);
      setReturnModalOpen(false);
      setReturnTarget(null);
      setToast({ type: 'success', message: `"${returnTarget.bookTitle}" has been returned successfully.` });
      loadTransactions();
    } catch (err) {
      setReturningBook(null);
      setToast({ type: 'error', message: getErrorMessage(err) });
    }
  };

  const handlePayFine = (fine) => setPayingFine(fine);

  const handlePaid = async (id, txnId) => {
    try {
      await borrowApi.payFine(id, txnId);
      setPayingFine(null);
      setToast({ type: 'success', message: 'Fine paid successfully.' });
      loadTransactions();
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err) });
    }
  };

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
      <h1 className="page-title">My Borrowed Books</h1>
      <p className="page-subtitle">Books currently issued to you.</p>
      <div className="card">
        {transactions.length === 0 ? (
          <p className="empty-state">You have no borrowed books.</p>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Overdue</th>
                  <th>Fine</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className={t.overdueDays > 0 ? 'overdue-row' : ''}>
                    <td>
                      <strong>{t.bookTitle}</strong>
                      {t.copyCode && <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Copy: {t.copyCode}</div>}
                    </td>
                    <td>{t.issueDate ? fmtDate(t.issueDate) : '-'}</td>
                    <td>{t.dueDate ? fmtDate(t.dueDate) : '-'}</td>
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
                          {t.finePerDay && (
                            <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>
                              ₹{fmt(t.finePerDay)}/day × {t.overdueDays} day(s)
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{color: 'var(--success)'}}>₹0.00</span>
                      )}
                      {t.finePaid && <div style={{fontSize: '0.75rem', color: 'var(--success)', marginTop: 4}}>✓ Paid</div>}
                    </td>
                    <td style={{whiteSpace: 'nowrap'}}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleReturnClick(t)}
                        disabled={returningBook === t.id}
                        style={{marginRight: 8}}
                      >
                        {returningBook === t.id ? 'Returning...' : 'Return Book'}
                      </button>
                      {t.fineAmount && t.fineAmount > 0 && !t.finePaid && (
                        <button
                          className="btn btn-accent btn-sm"
                          onClick={() => handlePayFine(t)}
                        >
                          Pay Fine
                        </button>
                      )}
                      {t.finePaid && (
                        <span className="badge badge-paid" style={{fontSize: '0.7rem', padding: '4px 8px'}}>Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {payingFine && (
        <FinePaymentModal
          fine={payingFine}
          onClose={() => setPayingFine(null)}
          onPaid={handlePaid}
        />
      )}

      {returnModalOpen && returnTarget && (
        <ReturnBookModal
          bookTitle={returnTarget.bookTitle}
          onClose={handleReturnClose}
          onConfirm={handleReturnConfirm}
        />
      )}

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
