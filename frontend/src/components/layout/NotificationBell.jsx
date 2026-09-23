import React, { useEffect, useState } from 'react';
import { notificationApi } from '../../api/notificationApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../common/Spinner';

const TYPE_LABELS = {
  BORROW_REQUEST_APPROVED: 'Approved',
  BORROW_REQUEST_REJECTED: 'Rejected',
  BOOK_ISSUED: 'Issued',
  BOOK_RETURNED: 'Returned',
  BOOK_OVERDUE: 'Overdue',
  FINE_CREATED: 'Fine',
  FINE_PAID: 'Paid',
  RESERVATION_FULFILLED: 'Reservation',
  SYSTEM: 'System',
};

const TYPE_COLORS = {
  BORROW_REQUEST_APPROVED: 'badge-available',
  BORROW_REQUEST_REJECTED: 'badge-rejected',
  BOOK_ISSUED: 'badge-active',
  BOOK_RETURNED: 'badge-available',
  BOOK_OVERDUE: 'badge-rejected',
  FINE_CREATED: 'badge-unpaid',
  FINE_PAID: 'badge-available',
  RESERVATION_FULFILLED: 'badge-active',
  SYSTEM: 'badge-none',
};

function formatDate(v) {
  if (!v) return '-';
  return new Date(v).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, countRes] = await Promise.all([
        notificationApi.getMyNotifications(),
        notificationApi.getUnreadCount(),
      ]);
      setNotifications(listRes.data);
      setUnreadCount(countRes.data.unreadCount);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Refresh periodically while the bell is open
    if (!open) return undefined;
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [open]);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead();
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="notification-bell">
      <button
        className="bell-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <strong>Notifications</strong>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead} disabled={markingAll}>
                  {markingAll ? 'Marking...' : 'Mark all read'}
                </button>
              )}
              <button className="btn-ghost btn-sm" onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          <div className="notification-body">
            {loading && !notifications ? (
              <Spinner />
            ) : error ? (
              <div className="empty-state">
                <p>{error}</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={load}>Retry</button>
              </div>
            ) : notifications && notifications.length === 0 ? (
              <div className="empty-state">
                <p>No notifications.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${n.read ? 'read' : 'unread'}`}
                  onClick={() => {
                    if (!n.read) handleMarkRead(n.id);
                  }}
                >
                  <div className="notification-top">
                    <span className={`badge ${TYPE_COLORS[n.type] || 'badge-none'}`}>
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                    <span className="notification-time">{formatDate(n.createdAt)}</span>
                  </div>
                  <div className="notification-message">{n.message}</div>
                  {!n.read && <span className="notification-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}