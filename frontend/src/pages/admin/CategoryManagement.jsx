import React, { useEffect, useState } from 'react';
import { categoryApi } from '../../api/lookupApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';

export default function CategoryManagement() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => categoryApi.getAll().then(({ data }) => setItems(data)).catch((err) => setError(getErrorMessage(err)));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await categoryApi.update(editingId, form);
      else await categoryApi.create(form);
      setForm({ name: '', description: '' });
      setEditingId(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleEdit = (item) => { setForm({ name: item.name, description: item.description || '' }); setEditingId(item.id); };
  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await categoryApi.delete(id); load(); } catch (err) { setError(getErrorMessage(err)); }
  };

  if (!items) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Category Management</h1>
      <p className="page-subtitle">Organize books into categories.</p>
      <Alert message={error} />
      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Category' : 'Add Category'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <button className="btn btn-primary">{editingId ? 'Update' : 'Add'}</button>
            {editingId && <button type="button" className="btn btn-outline" style={{ marginLeft: 8 }} onClick={() => { setEditingId(null); setForm({ name: '', description: '' }); }}>Cancel</button>}
          </form>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>All Categories</h3>
          <table>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(c)}>Edit</button>
                    <button className="btn btn-danger btn-sm" style={{ marginLeft: 6 }} onClick={() => handleDelete(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
