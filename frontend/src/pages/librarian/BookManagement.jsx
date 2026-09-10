import React, { useEffect, useState } from 'react';
import { bookApi } from '../../api/bookApi';
import { categoryApi, authorApi, publisherApi } from '../../api/lookupApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Pagination from '../../components/common/Pagination';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const emptyForm = {
  isbn: '', title: '', description: '', authorId: '', publisherId: '', categoryId: '',
  language: '', edition: '', publicationYear: '', totalCopies: 1, imageUrl: '',
};

export default function BookManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadBooks = async (p = 0) => {
    setLoading(true);
    try {
      const { data } = await bookApi.getAll({ page: p, size: 10 });
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
    loadBooks(0);
    categoryApi.getAll().then(({ data }) => setCategories(data)).catch(() => {});
    authorApi.getAll().then(({ data }) => setAuthors(data)).catch(() => {});
    publisherApi.getAll().then(({ data }) => setPublishers(data)).catch(() => {});
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const openEdit = (book) => {
    setForm({
      isbn: book.isbn, title: book.title, description: book.description || '',
      authorId: book.authorId, publisherId: book.publisherId, categoryId: book.categoryId,
      language: book.language || '', edition: book.edition || '',
      publicationYear: book.publicationYear || '', totalCopies: book.totalCopies, imageUrl: book.imageUrl || '',
    });
    setEditingId(book.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        authorId: Number(form.authorId),
        publisherId: Number(form.publisherId),
        categoryId: Number(form.categoryId),
        publicationYear: form.publicationYear ? Number(form.publicationYear) : null,
        totalCopies: Number(form.totalCopies),
      };
      if (editingId) {
        await bookApi.update(editingId, payload);
        setSuccess('Book updated successfully.');
      } else {
        await bookApi.create(payload);
        setSuccess('Book added successfully. Add copies from the Book Copies page.');
      }
      setShowForm(false);
      loadBooks(page);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this book? This is a soft delete - borrowing history is preserved.')) return;
    try {
      await bookApi.delete(id);
      loadBooks(page);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Book Management</h1>
          <p className="page-subtitle">Add, edit, and manage the book catalog.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Book</button>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Book' : 'Add New Book'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-2">
              <div className="form-group">
                <label>ISBN *</label>
                <input required value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Author *</label>
                <select required value={form.authorId} onChange={(e) => setForm({ ...form, authorId: e.target.value })}>
                  <option value="">Select author</option>
                  {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Publisher *</label>
                <select required value={form.publisherId} onChange={(e) => setForm({ ...form, publisherId: e.target.value })}>
                  <option value="">Select publisher</option>
                  {publishers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Language</label>
                <input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Edition</label>
                <input value={form.edition} onChange={(e) => setForm({ ...form, edition: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Publication Year</label>
                <input type="number" value={form.publicationYear} onChange={(e) => setForm({ ...form, publicationYear: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Total Copies (initial) *</label>
                <input type="number" min={0} required disabled={!!editingId}
                  value={form.totalCopies} onChange={(e) => setForm({ ...form, totalCopies: e.target.value })} />
                {editingId && <small style={{ color: 'var(--text-muted)' }}>Manage copies from the Book Copies page.</small>}
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Book'}</button>
            <button type="button" className="btn btn-outline" style={{ marginLeft: 8 }} onClick={() => setShowForm(false)}>Cancel</button>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <Spinner /> : (
          <>
            <table>
              <thead>
                <tr><th>Title</th><th>ISBN</th><th>Category</th><th>Available/Total</th><th></th></tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id}>
                    <td><Link to={`/books/${b.id}`}>{b.title}</Link></td>
                    <td>{b.isbn}</td>
                    <td>{b.categoryName}</td>
                    <td>{b.availableCopies} / {b.totalCopies}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(b)}>Edit</button>
                      {isAdmin && (
                        <button className="btn btn-danger btn-sm" style={{ marginLeft: 6 }} onClick={() => handleDelete(b.id)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onChange={loadBooks} />
          </>
        )}
      </div>
    </div>
  );
}
