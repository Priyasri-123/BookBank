import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

const DASHBOARD_BY_ROLE = {
  STUDENT: '/student/dashboard',
  LIBRARIAN: '/librarian/dashboard',
  ADMIN: '/admin/dashboard',
};

export default function Home() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={DASHBOARD_BY_ROLE[user.role] || '/books'} replace />;
  }

  return (
    <div>
      <div className="navbar">
        <span className="brand">📚 Smart Book Bank Management System</span>
        <div className="nav-links">
          <Link to="/books">Browse Books</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </div>
      <div style={{ maxWidth: 800, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <h1 style={{ fontSize: '2.2rem', color: 'var(--primary-dark)' }}>
          Manage your campus library, the smart way
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: 32 }}>
          Search the catalog, borrow and reserve books, track due dates and fines —
          all in one place for students, librarians, and administrators.
        </p>
        <Link to="/register" className="btn btn-primary" style={{ marginRight: 12 }}>
          Get Started
        </Link>
        <Link to="/books" className="btn btn-outline">
          Browse Catalog
        </Link>
      </div>
    </div>
  );
}
