import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookApi } from '../../api/bookApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Pagination from '../../components/common/Pagination';
import { useAuth } from '../../context/AuthContext';

export default function BookSearch() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBooks = async (currentPage = 0, searchTerm = '') => {
    setLoading(true);
    setError('');
    try {
      const { data } = await bookApi.getAll({ keyword: searchTerm || undefined, page: currentPage, size: 12 });
      setBooks(data.content);
      setTotalPages(data.totalPages);
      setPage(data.number);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks(0, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadBooks(0, keyword);
  };

  const content = (
    <div>
      <h1 className="page-title">Browse Books</h1>
      <p className="page-subtitle">Search the full catalog by title, author, ISBN, category, or publisher.</p>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          placeholder="Search by title, author, ISBN..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button className="btn btn-primary">Search</button>
      </form>

      <Alert message={error} />

      {loading ? (
        <Spinner />
      ) : books.length === 0 ? (
        <div className="empty-state">No books found. Try a different search.</div>
      ) : (
        <>
          <div className="grid grid-4">
            {books.map((book) => (
              <Link key={book.id} to={`/books/${book.id}`} className="card book-card">
                <div className="book-cover">📖</div>
                <div className="book-title">{book.title}</div>
                <div className="book-meta">by {book.authorName}</div>
                <div className="book-meta">{book.categoryName}</div>
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <span className={`badge ${book.availableCopies > 0 ? 'badge-available' : 'badge-issued'}`}>
                    {book.availableCopies > 0 ? `${book.availableCopies} available` : 'Unavailable'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={(p) => loadBooks(p, keyword)} />
        </>
      )}
    </div>
  );

  return content;
}
