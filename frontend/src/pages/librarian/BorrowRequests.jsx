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
  const [keyword, setKeyword] = useState('');
  const [statuses, setStatus] = useState([]);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [finePaid, setFinePaid] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async (currentFilter, currentKeyword, currentStatuses, currentOverdue, currentFinePaid, currentFrom, currentTo) => {
    setLoading(true);
    try {
      let data;
      if (currentFilter === 'PENDING') {
        const { data: res } = await borrowApi.getPending();
        data = res;
      } else if (currentFilter === 'OVERDUE') {
        const { data: res } = await borrowApi.getFiltered({
          statuses: ['OVERDUE'],
        });
        data = res;
      } else if (currentFilter === 'ALL' && !currentKeyword && currentStatuses.length === 0 && !currentOverdue && !currentFinePaid && !currentFrom && !currentTo) {
        const { data: res } = await borrowApi.getAll();
        data = res;
      } else {
        const { data: res } = await borrowApi.getFiltered({
          keyword: currentKeyword || undefined,
          statuses: currentStatuses.length ? currentStatuses : undefined,
          finePaid: currentFinePaid ? currentFinePaid === 'true' : undefined,
          requestDateFrom: currentFrom ? new Date(currentFrom + 'T00:00:00').toISOString() : undefined,
          requestDateTo: currentTo ? new Date(currentTo + 'T23:59:59').toISOString() : undefined,
        });
        data = res;
      }
      if (currentOverdue) {
        data = data.filter((t) => t.status === 'OVERDUE');
      }
      setTransactions(data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load('PENDING', '', [], false, '', '', ''); }, []);

  const handleQuickFilter = (f) => {
    setFilter(f);
    if (f === 'PENDING') {
      setStatus([]);
      setOverdueOnly(false);
      setFinePaid('');
      setDateFrom('');
      setDateTo('');
      load('PENDING', '', [], false, '', '', '');
    } else {
      load(f, keyword, statuses, overdueOnly, finePaid, dateFrom, dateTo);
    }
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    load(filter, keyword, statuses, overdueOnly, finePaid, dateFrom, dateTo);
  };

  const handleClearFilters = () => {
    setKeyword('');
    setStatus([]);
    setOverdueOnly(false);
    setFinePaid('');
    setDateFrom('');
    setDateTo('');
    load(filter, '', [], false, '', '', '');
  };

  const toggleStatus = (s) => {
    setStatus((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const handleApprove = async (id) => {
    try {
      await borrowApi.approve(id);
      setToast({ type: 'success', message: 'Request approved successfully.' });
      load(filter, keyword, statuses, overdueOnly, finePaid, dateFrom, dateTo);
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
      load(filter, keyword, statuses, overdueOnly, finePaid, dateFrom, dateTo);
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
      load(filter, keyword, statuses, overdueOnly, finePaid, dateFrom, dateTo);
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err) });
    }
  };

  const fmtMoney = (v) => {
    if (v === null || v === undefined) return '0.00';
    return Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const canApprove = (t) => {
    if (t.status !== 'REQUESTED') return false;
    if (t.studentHasOverdue) return false;
    if (t.studentHasUnpaidFines) return false;
    return true;
  };

  const restrictionReason = (t) => {
    if (t.studentHasOverdue && t.studentHasUnpaidFines) {
      return 'Student has overdue books and unpaid fines.';
    }
    if (t.studentHasOverdue) {
      return `Student has ${t.studentOverdueCount} overdue book(s).`;
    }
    if (t.studentHasUnpaidFines) {
      return `Student has unpaid fines of ₹${fmtMoney(t.studentUnpaidFines)}.`;
    }
    return null;
  };

  return (
        <div>
          <h1 className="page-title">Borrow Requests</h1>
          <p className="page-subtitle">Approve, reject, and manage returns for borrow requests.</p>

          <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className={`btn btn-sm ${filter === 'PENDING' ? 'btn-primary' : 'btn-outline'}`} onClick={() => handleQuickFilter('PENDING')}>Pending</button>
            <button className={`btn btn-sm ${filter === 'ALL' ? 'btn-primary' : 'btn-outline'}`} style={{ marginLeft: 8 }} onClick={() => handleQuickFilter('ALL')}>All</button>
            <button className={`btn btn-sm ${filter === 'OVERDUE' ? 'btn-primary' : 'btn-outline'}`} style={{ marginLeft: 8 }} onClick={() => handleQuickFilter('OVERDUE')}>Overdue</button>
            <button
              className="btn btn-outline btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setShowFilters((v) => !v)}
            >
              {showFilters ? 'Hide Filters' : 'Filters'}
            </button>
          </div>

          {showFilters && (
            <form className="card" style={{ marginBottom: 16 }} onSubmit={handleApplyFilters}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>Search (name / book / copy)</label>
                  <input
                    className="search-input"
                    placeholder="Type to search..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>Status</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {['REQUESTED', 'APPROVED', 'ISSUED', 'OVERDUE', 'RETURNED', 'REJECTED'].map((s) => (
                      <label key={s} style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input type="checkbox" checked={statuses.includes(s)} onChange={() => toggleStatus(s)} />
                        {s}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>Fine payment</label>
                  <select value={finePaid} onChange={(e) => setFinePaid(e.target.value)}>
                    <option value="">Any</option>
                    <option value="true">Paid</option>
                    <option value="false">Unpaid</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>Overdue only</label>
                  <label style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <input type="checkbox" checked={overdueOnly} onChange={(e) => setOverdueOnly(e.target.checked)} />
                    Show overdue only
                  </label>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>From date</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>To date</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>Apply</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={handleClearFilters} disabled={loading}>Clear</button>
              </div>
            </form>
          )}

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
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Register No.</th>
                      <th>Book</th>
                      <th>Requested</th>
                      <th>Availability</th>
                      <th>Borrowed</th>
                      <th>Overdue</th>
                      <th>Unpaid Fines</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => {
                      const restricted = t.status === 'REQUESTED' && !canApprove(t);
                      const reason = restricted ? restrictionReason(t) : null;
                      return (
                        <tr key={t.id} className={restricted ? 'overdue-row' : ''}>
                          <td>
                            <strong>{t.userName}</strong>
                            {restricted && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: 2, fontWeight: 600 }}>
                                ⚠ {reason}
                              </div>
                            )}
                          </td>
                          <td>{t.userRegisterNumber || '-'}</td>
                          <td>
                            <strong>{t.bookTitle}</strong>
                            {t.copyCode && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Copy: {t.copyCode}</div>
                            )}
                          </td>
                          <td>{t.requestDate ? new Date(t.requestDate).toLocaleDateString() : '-'}</td>
                          <td>
                            {t.bookAvailableCopies != null ? (
                              t.bookAvailableCopies > 0 ? (
                                <span className="badge badge-available">{t.bookAvailableCopies} avail</span>
                              ) : (
                                <span className="badge badge-rejected">None</span>
                              )
                            ) : '-'}
                          </td>
                          <td>{t.studentCurrentlyBorrowedCount ?? 0}</td>
                          <td>
                            {t.studentHasOverdue ? (
                              <span className="badge badge-rejected">Yes ({t.studentOverdueCount})</span>
                            ) : (
                              <span className="badge badge-available">No</span>
                            )}
                          </td>
                          <td>
                            {t.studentHasUnpaidFines ? (
                              <span className="badge badge-unpaid">₹{fmtMoney(t.studentUnpaidFines)}</span>
                            ) : (
                              <span className="badge badge-available">₹0.00</span>
                            )}
                          </td>
                          <td><Badge status={t.status} /></td>
                          <td>
                            {t.status === 'REQUESTED' && (
                              restricted ? (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>Restricted</span>
                              ) : (
                                <>
                                  <button className="btn btn-primary btn-sm" onClick={() => handleApprove(t.id)}>Approve</button>
                                  <button className="btn btn-danger btn-sm" style={{ marginLeft: 6 }} onClick={() => setRejectTarget(t)}>Reject</button>
                                </>
                              )
                            )}
                            {(t.status === 'ISSUED' || t.status === 'OVERDUE') && (
                              <button className="btn btn-accent btn-sm" onClick={() => handleReturn(t.id)}>Mark Returned</button>
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
