import React, { useEffect, useState } from 'react';
import { reservationApi } from '../../api/reservationApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';

export default function MyReservations() {
  const [reservations, setReservations] = useState(null);
  const [error, setError] = useState('');

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
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (error) return <Alert message={error} />;
  if (!reservations) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">My Reservations</h1>
      <p className="page-subtitle">Books you've reserved while waiting for a copy.</p>
      <div className="card">
        {reservations.length === 0 ? (
          <p className="empty-state">No reservations yet. Reserve an unavailable book from its details page.</p>
        ) : (
          <table>
            <thead><tr><th>Title</th><th>Reserved On</th><th>Expires</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id}>
                  <td>{r.bookTitle}</td>
                  <td>{new Date(r.reservationDate).toLocaleDateString()}</td>
                  <td>{r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : '-'}</td>
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
        )}
      </div>
    </div>
  );
}
