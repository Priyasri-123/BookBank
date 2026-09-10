import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { getErrorMessage } from '../../api/axios';
import StatCard from '../../components/common/StatCard';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.student()
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert message={error} />;
  if (!data) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Welcome back, {user?.name}</h1>
      <p className="page-subtitle">Here's a quick overview of your account.</p>

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Currently Borrowed" value={data.currentlyBorrowed.length} />
        <StatCard label="Overdue Books" value={data.overdueCount} />
        <StatCard label="Current Fines" value={`₹${data.currentFines}`} />
        <StatCard label="Total Borrowed (All Time)" value={data.totalBorrowedAllTime} />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Currently Borrowed Books</h3>
          {data.currentlyBorrowed.length === 0 ? (
            <p className="empty-state">You have no borrowed books right now.</p>
          ) : (
            <table>
              <thead><tr><th>Title</th><th>Due Date</th><th>Status</th></tr></thead>
              <tbody>
                {data.currentlyBorrowed.map((t) => (
                  <tr key={t.id}>
                    <td>{t.bookTitle}</td>
                    <td>{t.dueDate}</td>
                    <td><Badge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Active Reservations</h3>
          {data.activeReservations.length === 0 ? (
            <p className="empty-state">No active reservations.</p>
          ) : (
            <table>
              <thead><tr><th>Title</th><th>Status</th></tr></thead>
              <tbody>
                {data.activeReservations.map((r) => (
                  <tr key={r.id}>
                    <td>{r.bookTitle}</td>
                    <td><Badge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
