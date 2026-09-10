import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookApi } from '../../api/bookApi';
import { borrowApi } from '../../api/borrowApi';
import { reservationApi } from '../../api/reservationApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import { useAuth } from '../../context/AuthContext';

export default function BookDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    bookApi.getById(id)
      .then(({ data }) => setBook(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBorrow = async () => {
    if (!user) return navigate('/login');
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await borrowApi.request(book.id);
      setSuccess('Borrow request submitted! A librarian will review it shortly.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReserve = async () => {
    if (!user) return navigate('/login');
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await reservationApi.reserve(book.id);
      setSuccess('Book reserved! You will be notified when a copy becomes available.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Spinner />;
  if (!book) return <Alert message={error || 'Book not found'} />;

  const isAvailable = book.availableCopies > 0;
  const isStudent = user?.role === 'STUDENT';

  return (
    <div>
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="book-cover" style={{ height: 280, fontSize: '4rem' }}>📖</div>
        </div>
        <div>
          <h1 className="page-title">{book.title}</h1>
          <p className="page-subtitle">by {book.authorName} · {book.publisherName}</p>

          <Alert type="error" message={error} />
          <Alert type="success" message={success} />

          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ marginTop: 0 }}>{book.description || 'No description available.'}</p>
            <table>
              <tbody>
                <tr><td>ISBN</td><td>{book.isbn}</td></tr>
                <tr><td>Category</td><td>{book.categoryName}</td></tr>
                <tr><td>Language</td><td>{book.language || '-'}</td></tr>
                <tr><td>Edition</td><td>{book.edition || '-'}</td></tr>
                <tr><td>Publication Year</td><td>{book.publicationYear || '-'}</td></tr>
                <tr><td>Availability</td><td>{book.availableCopies} of {book.totalCopies} copies available</td></tr>
              </tbody>
            </table>
          </div>

          {isStudent && (
            isAvailable ? (
              <button className="btn btn-primary" onClick={handleBorrow} disabled={actionLoading}>
                {actionLoading ? 'Submitting...' : 'Request to Borrow'}
              </button>
            ) : (
              <button className="btn btn-accent" onClick={handleReserve} disabled={actionLoading}>
                {actionLoading ? 'Submitting...' : 'Reserve This Book'}
              </button>
            )
          )}
          {!user && (
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              Log in to borrow or reserve
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
