import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LINKS = {
  STUDENT: [
    { to: '/student/dashboard', label: 'Dashboard' },
    { to: '/books', label: 'Browse Books' },
    { to: '/student/borrowed', label: 'My Borrowed Books' },
    { to: '/student/history', label: 'Borrowing History' },
    { to: '/student/reservations', label: 'Reservations' },
    { to: '/student/profile', label: 'My Profile' },
  ],
  LIBRARIAN: [
    { to: '/librarian/dashboard', label: 'Dashboard' },
    { to: '/librarian/books', label: 'Book Management' },
    { to: '/librarian/copies', label: 'Book Copies' },
    { to: '/librarian/requests', label: 'Borrow Requests' },
    { to: '/librarian/overdue', label: 'Overdue Books' },
  ],
  ADMIN: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/users', label: 'User Management' },
    { to: '/admin/books', label: 'Book Management' },
    { to: '/admin/categories', label: 'Categories' },
    { to: '/admin/authors', label: 'Authors' },
    { to: '/admin/publishers', label: 'Publishers' },
    { to: '/admin/settings', label: 'System Settings' },
    { to: '/admin/requests', label: 'Pending Requests' },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  if (!user) return null;

  const links = LINKS[user.role] || [];

  return (
    <div className="sidebar">
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : '')}>
          {link.label}
        </NavLink>
      ))}
    </div>
  );
}
