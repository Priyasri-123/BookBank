import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboardApi';
import { getErrorMessage } from '../../api/axios';
import StatCard from '../../components/common/StatCard';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardApi.admin()
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <Alert message={error} />;
  if (!data) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-subtitle">System-wide overview.</p>
      <div className="grid grid-4">
        <StatCard label="Total Students" value={data.totalStudents} />
        <StatCard label="Total Books" value={data.totalBooks} />
        <StatCard label="Total Book Copies" value={data.totalBookCopies} />
        <StatCard label="Available Copies" value={data.availableBookCopies} />
      </div>
      <div className="grid grid-4" style={{ marginTop: 18 }}>
        <StatCard label="Issued Books" value={data.issuedBooks} />
        <StatCard label="Overdue Books" value={data.overdueBooks} />
        <StatCard label="Pending Requests" value={data.pendingRequests} />
        <StatCard label="Active Reservations" value={data.activeReservations} />
      </div>
      <div className="grid grid-4" style={{ marginTop: 18 }}>
        <StatCard label="Total Unpaid Fines" value={`₹${data.totalUnpaidFines}`} />
      </div>
      <div style={{ marginTop: 24 }}>
        <Link to="/admin/requests" className="btn btn-primary">Manage Pending Requests</Link>
      </div>
    </div>
  );
}
