import React, { useEffect, useState } from 'react';
import { publisherApi } from '../../api/lookupApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';

export default function PublisherManagement() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ name: '', website: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => publisherApi.getAll().then(({ data }) => setItems(data)).catch((err) => setError(getErrorMessage(err)));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) await publisherApi.update(editingId, form);
      else await publisherApi.create(form);
      setForm({ name: '', website: '' });
      setEditingId(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleEdit = (item) => { setForm({ name: item.name, website: item.website || '' }); setEditingId(item.id); };
  const handleDelete = async (id) => {
    if (!confirm('Delete this publisher?')) return;
    try { await publisherApi.delete(id); load(); } catch (err) { setError(getErrorMessage(err)); }
  };

  if (!items) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">Publisher Management</h1>
      <p className="page-subtitle">Manage publishers in the catalog.</p>
      <Alert message={error} />
      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Publisher' : 'Add Publisher'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Website</label>
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <button className="btn btn-primary">{editingId ? 'Update' : 'Add'}</button>
            {editingId && <button type="button" className="btn btn-outline" style={{ marginLeft: 8 }} onClick={() => { setEditingId(null); setForm({ name: '', website: '' }); }}>Cancel</button>}
          </form>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>All Publishers</h3>
          <table>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                    <button className="btn btn-danger btn-sm" style={{ marginLeft: 6 }} onClick={() => handleDelete(p.id)}>Delete</button>
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
