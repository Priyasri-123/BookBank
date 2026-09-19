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

  const loadDashboard = () => {
    setError('');
    dashboardApi.admin()
      .then((res) => setData(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (error) return (
    <div>
      <h1 className="page-title">Admin Dashboard</h1>
      <div className="card" style={{ marginTop: 18 }}>
        <Alert message={error} />
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={loadDashboard}>Retry</button>
      </div>
    </div>
  );
  if (!data) return <Spinner />;

  const fmtMoney = (v) => {
    if (v === null || v === undefined) return '₹0.00';
    return `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div>
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-subtitle">System-wide overview.</p>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Total Students" value={data.totalStudents} icon="👥" />
        <StatCard label="Total Books" value={data.totalBooks} icon="📚" />
        <StatCard label="Total Book Copies" value={data.totalBookCopies} icon="📖" />
        <StatCard label="Available Copies" value={data.availableBookCopies} icon="✅" />
      </div>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Issued Books" value={data.issuedBooks} icon="📋" />
        <StatCard label="Overdue Books" value={data.overdueBooks} icon="⏳" />
        <StatCard label="Pending Requests" value={data.pendingRequests} icon="🔔" />
        <StatCard label="Active Reservations" value={data.activeReservations} icon="📅" />
      </div>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Total Unpaid Fines" value={fmtMoney(data.totalUnpaidFines)} icon="💰" />
      </div>
      <div style={{ marginTop: 24 }}>
        <Link to="/admin/requests" className="btn btn-primary">Manage Pending Requests</Link>
      </div>
    </div>
  );
}
