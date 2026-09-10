import React, { useEffect, useState } from 'react';
import { bookApi, bookCopyApi } from '../../api/bookApi';
import { getErrorMessage } from '../../api/axios';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';

const STATUS_OPTIONS = ['AVAILABLE', 'ISSUED', 'RESERVED', 'LOST', 'DAMAGED'];

export default function BookCopies() {
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newCopy, setNewCopy] = useState({ copyCode: '', condition: 'NEW', purchaseDate: '' });

  useEffect(() => {
    bookApi.getAll({ size: 200 }).then(({ data }) => setBooks(data.content)).catch(() => {});
  }, []);

  const loadCopies = async (bookId) => {
    if (!bookId) { setCopies([]); return; }
    setLoading(true);
    try {
      const { data } = await bookCopyApi.getForBook(bookId);
      setCopies(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBook = (e) => {
    const id = e.target.value;
    setSelectedBookId(id);
    loadCopies(id);
  };

  const handleAddCopy = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await bookCopyApi.add({ bookId: Number(selectedBookId), ...newCopy });
      setSuccess('Copy added.');
      setNewCopy({ copyCode: '', condition: 'NEW', purchaseDate: '' });
      loadCopies(selectedBookId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleStatusChange = async (copyId, status) => {
    try {
      await bookCopyApi.updateStatus(copyId, status);
      loadCopies(selectedBookId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (copyId) => {
    if (!confirm('Remove this copy from circulation?')) return;
    try {
      await bookCopyApi.delete(copyId);
      loadCopies(selectedBookId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div>
      <h1 className="page-title">Book Copies</h1>
      <p className="page-subtitle">Manage individual physical copies of each book.</p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-group" style={{ maxWidth: 400 }}>
          <label>Select a book</label>
          <select value={selectedBookId} onChange={handleSelectBook}>
            <option value="">-- Choose a book --</option>
            {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
        </div>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {selectedBookId && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ marginTop: 0 }}>Add a new copy</h3>
            <form onSubmit={handleAddCopy} className="grid grid-3" style={{ alignItems: 'end' }}>
              <div className="form-group">
                <label>Copy Code *</label>
                <input required placeholder="e.g. BK004" value={newCopy.copyCode}
                  onChange={(e) => setNewCopy({ ...newCopy, copyCode: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Condition</label>
                <select value={newCopy.condition} onChange={(e) => setNewCopy({ ...newCopy, condition: e.target.value })}>
                  <option value="NEW">NEW</option>
                  <option value="GOOD">GOOD</option>
                  <option value="WORN">WORN</option>
                </select>
              </div>
              <button className="btn btn-primary">Add Copy</button>
            </form>
          </div>

          <div className="card">
            {loading ? <Spinner /> : copies.length === 0 ? (
              <p className="empty-state">No copies yet for this book.</p>
            ) : (
              <table>
                <thead><tr><th>Copy Code</th><th>Condition</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {copies.map((c) => (
                    <tr key={c.id}>
                      <td>{c.copyCode}</td>
                      <td>{c.condition}</td>
                      <td><Badge status={c.status} /></td>
                      <td>
                        <select value={c.status} onChange={(e) => handleStatusChange(c.id, e.target.value)} style={{ marginRight: 8 }}>
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
