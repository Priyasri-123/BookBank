import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/layout/Layout';

// Public pages
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import BookSearch from './pages/public/BookSearch';
import BookDetails from './pages/public/BookDetails';

// Auth pages
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyOtp from './pages/auth/VerifyOtp';
import ResetPassword from './pages/auth/ResetPassword';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyBorrowedBooks from './pages/student/MyBorrowedBooks';
import BorrowingHistory from './pages/student/BorrowingHistory';
import MyReservations from './pages/student/MyReservations';
import MyProfile from './pages/student/MyProfile';

// Librarian pages
import LibrarianDashboard from './pages/librarian/LibrarianDashboard';
import BookManagement from './pages/librarian/BookManagement';
import BookCopies from './pages/librarian/BookCopies';
import BorrowRequests from './pages/librarian/BorrowRequests';
import OverdueBooks from './pages/librarian/OverdueBooks';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import AuthorManagement from './pages/admin/AuthorManagement';
import PublisherManagement from './pages/admin/PublisherManagement';
import SystemSettings from './pages/admin/SystemSettings';

function withLayout(element) {
  return <Layout>{element}</Layout>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/books" element={withLayout(<BookSearch />)} />
      <Route path="/books/:id" element={withLayout(<BookDetails />)} />

      {/* Auth - password reset flow */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Student */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute roles={['STUDENT']}>{withLayout(<StudentDashboard />)}</ProtectedRoute>} />
      <Route path="/student/borrowed" element={
        <ProtectedRoute roles={['STUDENT']}>{withLayout(<MyBorrowedBooks />)}</ProtectedRoute>} />
      <Route path="/student/history" element={
        <ProtectedRoute roles={['STUDENT']}>{withLayout(<BorrowingHistory />)}</ProtectedRoute>} />
      <Route path="/student/reservations" element={
        <ProtectedRoute roles={['STUDENT']}>{withLayout(<MyReservations />)}</ProtectedRoute>} />
      <Route path="/student/profile" element={
        <ProtectedRoute roles={['STUDENT']}>{withLayout(<MyProfile />)}</ProtectedRoute>} />

      {/* Librarian */}
      <Route path="/librarian/dashboard" element={
        <ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}>{withLayout(<LibrarianDashboard />)}</ProtectedRoute>} />
      <Route path="/librarian/books" element={
        <ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}>{withLayout(<BookManagement />)}</ProtectedRoute>} />
      <Route path="/librarian/copies" element={
        <ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}>{withLayout(<BookCopies />)}</ProtectedRoute>} />
      <Route path="/librarian/requests" element={
        <ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}>{withLayout(<BorrowRequests />)}</ProtectedRoute>} />
      <Route path="/librarian/overdue" element={
        <ProtectedRoute roles={['LIBRARIAN', 'ADMIN']}>{withLayout(<OverdueBooks />)}</ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute roles={['ADMIN']}>{withLayout(<AdminDashboard />)}</ProtectedRoute>} />
      <Route path="/admin/users" element={
        <ProtectedRoute roles={['ADMIN']}>{withLayout(<UserManagement />)}</ProtectedRoute>} />
      <Route path="/admin/books" element={
        <ProtectedRoute roles={['ADMIN']}>{withLayout(<BookManagement />)}</ProtectedRoute>} />
      <Route path="/admin/categories" element={
        <ProtectedRoute roles={['ADMIN']}>{withLayout(<CategoryManagement />)}</ProtectedRoute>} />
      <Route path="/admin/authors" element={
        <ProtectedRoute roles={['ADMIN']}>{withLayout(<AuthorManagement />)}</ProtectedRoute>} />
      <Route path="/admin/publishers" element={
        <ProtectedRoute roles={['ADMIN']}>{withLayout(<PublisherManagement />)}</ProtectedRoute>} />
      <Route path="/admin/settings" element={
        <ProtectedRoute roles={['ADMIN']}>{withLayout(<SystemSettings />)}</ProtectedRoute>} />
      <Route path="/admin/requests" element={
        <ProtectedRoute roles={['ADMIN']}>{withLayout(<BorrowRequests />)}</ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
