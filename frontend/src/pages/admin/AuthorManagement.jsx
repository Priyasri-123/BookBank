import React, { useEffect, useState } from 'react';
import { authorApi } from '../../api/lookupApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';

export default function AuthorManagement() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ name: '', bio: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => authorApi.getAll().then(({ data }) => setItems(data)).catch((err) => setError(getErrorMessage(err)));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await authorApi.update(editingId, form);
      else await authorApi.create(form);
      setForm({ name: '', bio: '' });
      setEditingId(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleEdit = (item) => { setForm({ name: item.name, bio: item.bio || '' }); setEditingId(item.id); };
  const handleDelete = async (id) => {
    if (!confirm('Delete this author?')) return;
    try { await authorApi.delete(id); load(); } catch (err) { setError(getErrorMessage(err)); }
  };

  if (!items) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Author Management</h1>
      <p className="page-subtitle">Manage authors in the catalog.</p>
      <Alert message={error} />
      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Author' : 'Add Author'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <button className="btn btn-primary">{editingId ? 'Update' : 'Add'}</button>
            {editingId && <button type="button" className="btn btn-outline" style={{ marginLeft: 8 }} onClick={() => { setEditingId(null); setForm({ name: '', bio: '' }); }}>Cancel</button>}
          </form>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>All Authors</h3>
          <table>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(a)}>Edit</button>
                    <button className="btn btn-danger btn-sm" style={{ marginLeft: 6 }} onClick={() => handleDelete(a.id)}>Delete</button>
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
