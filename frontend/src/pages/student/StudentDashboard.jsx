import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboardApi';
import { borrowApi } from '../../api/borrowApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import FinePaymentModal from '../../components/student/FinePaymentModal';
import ReturnBookModal from '../../components/student/ReturnBookModal';
import Toast from '../../components/common/Toast';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [fines, setFines] = useState(null);
  const [error, setError] = useState('');
  const [payingFine, setPayingFine] = useState(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState(null);
  const [returningBook, setReturningBook] = useState(null);
  const [toast, setToast] = useState(null);

  const loadDashboard = () => {
    Promise.all([dashboardApi.student(), borrowApi.getMyFines()])
      .then(([dash, fin]) => {
        setData(dash.data);
        setFines(fin.data);
      })
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(() => {
    setError('');
    loadDashboard();
  }, []);

  const outstandingFine = useMemo(() => {
    // Single source of truth: the backend's finePaid/finePaidAmount fields.
    // Do NOT use a local paidFines tracker — it resets on page refresh and
    // would show stale (reverted) fine data after a successful payment.
    return (fines || [])
      .filter((f) => !f.finePaid)
      .reduce((sum, f) => sum + num(f.fineAmount), 0);
  }, [fines]);

  const unpaidFineList = (fines || []).filter((f) => !f.finePaid);
  const hasUnpaidFine = outstandingFine > 0;

  const overdueDays = useMemo(() => {
    if (!hasUnpaidFine) return 0;
    const unpaidFines = unpaidFineList;
    if (unpaidFines.length === 0) return 0;
    const latestDue = new Date(Math.max(...unpaidFines.map((f) => new Date(f.dueDate || Date.now()).getTime())));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    latestDue.setHours(0, 0, 0, 0);
    const diff = Math.round((today - latestDue) / 86400000);
    return Math.max(0, diff);
  }, [hasUnpaidFine, unpaidFineList]);

  const lastPaidTxnId = (() => {
    const paid = (fines || []).find((f) => f.finePaid);
    return paid?.finePaymentTxnId || '';
  })();

  const handlePaid = async (id, txnId) => {
    try {
      await borrowApi.payFine(id, txnId);
      setToast({ type: 'success', message: 'Fine paid successfully.' });
      loadDashboard();
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err) });
    }
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
      loadDashboard();
    } catch (err) {
      setReturningBook(null);
      setToast({ type: 'error', message: getErrorMessage(err) });
    }
  };

  if (error) return (
    <div className="dashboard">
      <div className="card">
        <Alert message={error} />
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={loadDashboard}>Retry</button>
      </div>
    </div>
  );
  if (!data || !fines) return <Spinner />;

  return (
    <div className="dashboard">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <div className="welcome-avatar">
            {(user?.name || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="page-title">Welcome back, {user?.name || 'Student'}</h1>
          </div>
        </div>
        <div className="welcome-date">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-4 dashboard-cards" style={{ marginBottom: 24 }}>
        <div className="card stat-card stat-hover">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{num(data.totalBooks)}</div>
          <div className="stat-label">Total Books</div>
        </div>
        <div className="card stat-card stat-hover">
          <div className="stat-icon">📖</div>
          <div className="stat-value">{data.currentlyBorrowed.length}</div>
          <div className="stat-label">Currently Borrowed</div>
        </div>
        <div
          className="card stat-card stat-hover"
          style={data.overdueCount > 0 ? { borderLeft: '4px solid var(--danger)' } : undefined}
        >
          <div className="stat-icon" style={{ color: data.overdueCount > 0 ? 'var(--danger)' : undefined }}>⏳</div>
          <div className="stat-value" style={{ color: data.overdueCount > 0 ? 'var(--danger)' : 'var(--primary-dark)' }}>
            {data.overdueCount}
          </div>
          <div className="stat-label">Overdue</div>
        </div>
        <div
          className="card stat-card stat-hover"
          style={hasUnpaidFine ? { borderLeft: '4px solid var(--danger)' } : undefined}
        >
          <div className="stat-icon" style={{ fontSize: '1.4rem' }}>💰</div>
          <div className="stat-value" style={{ color: hasUnpaidFine ? 'var(--danger)' : 'var(--success)' }}>
            ₹{fmt(outstandingFine)}
          </div>
          <div className="stat-label">Outstanding Fine</div>
        </div>
      </div>

      {/* Fine & Payment Section */}
      <div style={{ marginBottom: 24 }}>
        {hasUnpaidFine ? (
          <div className="card fine-cta-card">
            <div className="fine-cta-content">
              <div className="fine-cta-info">
                <div className="fine-cta-label">Outstanding Fine</div>
                <div className="fine-cta-amount">₹{fmt(outstandingFine)}</div>
                <div className="fine-cta-book">{unpaidFineList[0]?.bookTitle}</div>
                <div className="fine-cta-days">{overdueDays} days overdue</div>
              </div>
              <div className="fine-cta-actions">
                <button className="btn btn-accent btn-lg" onClick={() => setPayingFine(unpaidFineList[0])}>
                  Pay Fine
                </button>
              </div>
            </div>
          </div>
        ) : lastPaidTxnId ? (
          <div className="card fine-cta-card fine-cta-clean">
            <div className="fine-cta-content">
              <div className="fine-cta-info">
                <div className="fine-cta-label" style={{ color: 'var(--success)' }}>Outstanding Fine</div>
                <div className="fine-cta-amount" style={{ color: 'var(--success)' }}>₹{fmt(outstandingFine)}</div>
                <div style={{ color: 'var(--success)', fontWeight: 600, marginTop: 4 }}>✓ Fine Paid</div>
                <div className="fine-cta-txn">Transaction ID: <strong>{lastPaidTxnId}</strong></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card fine-cta-card fine-cta-clean">
            <div className="fine-cta-content">
              <div className="fine-cta-info">
                <div className="fine-cta-label" style={{ color: 'var(--success)' }}>Outstanding Fine</div>
                <div className="fine-cta-amount" style={{ color: 'var(--success)' }}>₹{fmt(outstandingFine)}</div>
                <div style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.9rem' }}>All fines are paid</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Paid fines alert */}
      <div style={{ marginBottom: 24 }}>
        {hasUnpaidFine && (
          <Alert
            type="error"
            message={`You have an outstanding fine of ₹${fmt(outstandingFine)}. Pay it to avoid further accrual.`}
          />
        )}
        {!hasUnpaidFine && (fines || []).some((f) => f.finePaid) && (
          <Alert
            type="success"
            message="✓ All your fines are paid. Great job!"
          />
        )}
      </div>

      {/* Currently Borrowed Books */}
      <div style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Currently Borrowed Books</h3>
          {data.currentlyBorrowed.length === 0 ? (
            <div className="empty-state">
              <p>No borrowed books right now.</p>
              <Link to="/books" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Browse Books</Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Book</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Fine</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.currentlyBorrowed.map((t) => {
                    const overdue = isOverdue(t);
                    const hasFine = t.fineAmount && t.fineAmount > 0;
                    const unpaidFine = hasFine && !Boolean(t.finePaid);
                    return (
                      <tr key={t.id} className={overdue ? 'overdue-row' : ''}>
                        <td>
                          <strong>{t.bookTitle}</strong>
                          {t.copyCode && <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Copy: {t.copyCode}</div>}
                        </td>
                        <td>{t.issueDate ? fmtDate(t.issueDate) : '-'}</td>
                        <td>
                          {t.dueDate ? fmtDate(t.dueDate) : '-'}
                          {overdue && <span style={{color: 'var(--danger)', fontWeight: 600, fontSize: '0.8rem', marginLeft: 6}}>OVERDUE</span>}
                        </td>
                        <td><Badge status={t.status} /></td>
                        <td>
                          {hasFine ? (
                            <>
                              <div>₹{fmt(t.fineAmount)}</div>
                              {t.finePaid ? (
                                <div style={{fontSize: '0.75rem', color: 'var(--success)'}}>✓ Paid</div>
                              ) : (
                                <div style={{fontSize: '0.75rem', color: 'var(--danger)'}}>Unpaid</div>
                              )}
                            </>
                          ) : (
                            <span style={{color: 'var(--success)'}}>₹0.00</span>
                          )}
                        </td>
                        <td style={{whiteSpace: 'nowrap'}}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => { setReturnTarget(t); setReturnModalOpen(true); }}
                            disabled={returningBook === t.id}
                            style={{marginRight: 8}}
                          >
                            {returningBook === t.id ? 'Returning...' : 'Return Book'}
                          </button>
                          {overdue && unpaidFine && (
                            <button
                              className="btn btn-accent btn-sm"
                              onClick={() => setPayingFine(t)}
                            >
                              Pay Fine
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Notifications / Important Alerts */}
      <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.overdueCount > 0 && !hasUnpaidFine && (
          <div className="alert alert-error">
            ⚠ You have <strong>{data.overdueCount}</strong> overdue book(s). Please return them soon.
          </div>
        )}
        {hasUnpaidFine && (
          <div className="alert alert-error">
            💰 You have an outstanding fine of <strong>₹{fmt(outstandingFine)}</strong>.
          </div>
        )}
        {data.pendingRequests > 0 && (
          <div className="alert alert-error">
            ⏳ You have <strong>{data.pendingRequests}</strong> pending borrow request(s) awaiting approval.
          </div>
        )}
        {!hasUnpaidFine && data.overdueCount === 0 && data.pendingRequests === 0 && (
          <div className="alert alert-success">
            ✓ Everything looks good. No overdue books, pending requests, or outstanding fines.
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>Quick Actions</h3>
        <div className="grid grid-4">
          <Link to="/books" className="card stat-card stat-hover quick-action">
            <div className="quick-action-icon">🔍</div>
            <div className="quick-action-label">Browse Books</div>
          </Link>
          <Link to="/student/borrowed" className="card stat-card stat-hover quick-action">
            <div className="quick-action-icon">📚</div>
            <div className="quick-action-label">My Borrowed Books</div>
          </Link>
          <Link to="/student/reservations" className="card stat-card stat-hover quick-action">
            <div className="quick-action-icon">📅</div>
            <div className="quick-action-label">Reservations</div>
          </Link>
          <Link to="/student/history" className="card stat-card stat-hover quick-action">
            <div className="quick-action-icon">🕐</div>
            <div className="quick-action-label">Borrowing History</div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recent Activity</h3>
          <div className="empty-state">No recent activity.</div>
        </div>
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
          onClose={() => { setReturnModalOpen(false); setReturnTarget(null); }}
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

/* ---- helpers ---- */

function num(v) {
  if (v === null || v === undefined || v === '') return 0;
  return Number(v);
}

function fmt(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(v) {
  if (!v) return '-';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return new Date(v + 'T00:00:00').toLocaleDateString();
  }
  return new Date(v).toLocaleDateString();
}

function isOverdue(t) {
  return t.status === 'OVERDUE' || (t.dueDate && new Date(t.dueDate) < new Date());
}
