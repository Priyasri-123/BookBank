import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Alert from '../../components/common/Alert';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', department: '', year: '', registerNumber: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await register(form);
    setSubmitting(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <h1>Create your account</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>Register as a student to start borrowing books</p>
        <Alert message={error} />
        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Full Name *</label>
              <input required value={form.name} onChange={update('name')} />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" required value={form.email} onChange={update('email')} />
            </div>
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input type="password" required minLength={6} value={form.password} onChange={update('password')} />
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={update('phone')} placeholder="10-digit number" />
            </div>
            <div className="form-group">
              <label>Register Number</label>
              <input value={form.registerNumber} onChange={update('registerNumber')} />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input value={form.department} onChange={update('department')} placeholder="e.g. CSE" />
            </div>
            <div className="form-group">
              <label>Year</label>
              <input value={form.year} onChange={update('year')} placeholder="e.g. 2026" />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <div className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
