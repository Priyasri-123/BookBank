import React, { useEffect, useState } from 'react';
import { userApi } from '../../api/userApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', department: '', year: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userApi.getMyProfile().then(({ data }) => {
      setProfile(data);
      setForm({ name: data.name, phone: data.phone || '', department: data.department || '', year: data.year || '' });
    }).catch((err) => setError(getErrorMessage(err)));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await userApi.updateMyProfile(form);
      setProfile(data);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return error ? <Alert message={error} /> : <Spinner />;

  return (
    <div>
      <h1 className="page-title">My Profile</h1>
      <p className="page-subtitle">Update your personal details.</p>
      <div className="card" style={{ maxWidth: 500 }}>
        <Alert type="error" message={error} />
        <Alert type="success" message={success} />
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email (read-only)</label>
            <input value={profile.email} disabled />
          </div>
          <div className="form-group">
            <label>Register Number (read-only)</label>
            <input value={profile.registerNumber || '-'} disabled />
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Department</label>
            <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Year</label>
            <input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          </div>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  );
}
