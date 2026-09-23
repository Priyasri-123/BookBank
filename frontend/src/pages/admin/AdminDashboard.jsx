import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../../api/dashboardApi';
import { getErrorMessage } from '../../api/axios';
import StatCard from '../../components/common/StatCard';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Toast from '../../components/common/Toast';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const loadDashboard = (showRefreshToast = false) => {
    setError('');
    dashboardApi.admin()
      .then((res) => {
        setData(res.data);
        if (showRefreshToast) {
          setToast({ type: 'success', message: 'Dashboard refreshed.' });
        }
      })
      .catch((err) => {
        setError(getErrorMessage(err));
        setToast({ type: 'error', message: getErrorMessage(err) });
      });
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

      <div className="section-heading">Users</div>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Total Students" value={data.totalStudents} icon="👥" />
      </div>

      <div className="section-heading">Library</div>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Total Books" value={data.totalBooks} icon="📚" />
        <StatCard label="Total Book Copies" value={data.totalBookCopies} icon="📖" />
        <StatCard label="Available Copies" value={data.availableBookCopies} icon="✅" />
        <StatCard label="Issued Books" value={data.issuedBooks} icon="📋" />
      </div>

      <div className="section-heading">Borrowing</div>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Pending Requests" value={data.pendingRequests} icon="🔔" />
        <StatCard label="Overdue Books" value={data.overdueBooks} icon="⏳" />
        <StatCard label="Students With Overdue Books" value={data.studentsWithOverdueBooks} icon="⚠️" />
        <StatCard label="Active Reservations" value={data.activeReservations} icon="📅" />
      </div>

      <div className="section-heading">Fines</div>
      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Total Unpaid Fines" value={fmtMoney(data.totalUnpaidFines)} icon="💰" />
        <StatCard label="Students With Unpaid Fines" value={data.studentsWithUnpaidFines} icon="⚠️" />
        <StatCard label="Total Paid Fines" value={fmtMoney(data.totalPaidFines)} icon="✅" />
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
        <Link to="/admin/requests" className="btn btn-primary">Manage Pending Requests</Link>
        <Link to="/admin/fines" className="btn btn-outline">Fine Management</Link>
        <button className="btn btn-outline btn-sm" onClick={() => loadDashboard(true)}>↻ Refresh</button>
      </div>

      <Toast
        type={toast?.type}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
