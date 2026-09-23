import React, { useEffect, useState } from 'react';
import { reservationApi } from '../../api/reservationApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Toast from '../../components/common/Toast';

export default function MyReservations() {
  const [reservations, setReservations] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const load = () => {
    reservationApi.getAll()
      .then((res) => setReservations(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(load, []);

  const handleCancel = async (id) => {
    if (!confirm('Cancel this reservation?')) return;
    try {
      await reservationApi.cancel(id);
      setToast({ type: 'success', message: 'Reservation cancelled.' });
      load();
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err) });
    }
  };

  if (error) return <Alert message={error} />;
  if (!reservations) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">My Reservations</h1>
      <p className="page-subtitle">Books you've reserved while waiting for a copy.</p>

      <Toast
        type={toast?.type}
        message={toast?.message}
        onClose={() => setToast(null)}
      />

      <div className="card">
        {reservations.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No reservations yet.</p>
            <p style={{ fontSize: '0.85rem' }}>Reserve an unavailable book from its details page.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Reserved On</th>
                  <th>Expires</th>
                  <th>Queue Position</th>
                  <th>Availability</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.bookTitle}</strong></td>
                    <td>{new Date(r.reservationDate).toLocaleDateString()}</td>
                    <td>{r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : '-'}</td>
                    <td>
                      {r.status === 'ACTIVE' && r.queuePosition != null ? (
                        <span className="badge badge-active">#{r.queuePosition}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {r.availableCopies != null && r.availableCopies > 0 ? (
                        <span className="badge badge-available">{r.availableCopies} available</span>
                      ) : (
                        <span className="badge badge-none">None</span>
                      )}
                    </td>
                    <td><Badge status={r.status} /></td>
                    <td>
                      {r.status === 'ACTIVE' && (
                        <button className="btn btn-outline btn-sm" onClick={() => handleCancel(r.id)}>Cancel</button>
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
