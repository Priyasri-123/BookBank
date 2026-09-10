import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { getErrorMessage } from '../../api/axios';
import StatCard from '../../components/common/StatCard';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';

export default function LibrarianDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.librarian()
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert message={error} />;
  if (!data) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Librarian Dashboard</h1>
      <p className="page-subtitle">Today's activity at a glance.</p>
      <div className="grid grid-4">
        <StatCard label="Pending Requests" value={data.pendingRequests} />
        <StatCard label="Issued Today" value={data.issuedToday} />
        <StatCard label="Returned Today" value={data.returnedToday} />
        <StatCard label="Overdue Books" value={data.overdueBooks} />
      </div>
      <div className="grid grid-4" style={{ marginTop: 18 }}>
        <StatCard label="Available Copies" value={data.availableBooks} />
      </div>
    </div>
  );
}
