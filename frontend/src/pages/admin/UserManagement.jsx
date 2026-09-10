import React, { useEffect, useState } from 'react';
import { userApi } from '../../api/userApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Badge from '../../components/common/Badge';

const ROLES = ['STUDENT', 'LIBRARIAN', 'ADMIN'];

export default function UserManagement() {
  const [users, setUsers] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = (search = '') => {
    userApi.getAll(search)
      .then((res) => setUsers(res.data))
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(() => load(), []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(keyword);
  };

  const handleToggleActive = async (user) => {
    try {
      await userApi.updateStatus(user.id, !user.active);
      setSuccess(`${user.name} ${!user.active ? 'activated' : 'deactivated'}.`);
      load(keyword);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleRoleChange = async (user, role) => {
    try {
      await userApi.changeRole(user.id, role);
      setSuccess(`${user.name}'s role updated to ${role}.`);
      load(keyword);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Delete user ${user.name}? This cannot be undone.`)) return;
    try {
      await userApi.delete(user.id);
      load(keyword);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (error && !users) return <Alert message={error} />;
  if (!users) return <Spinner />;

  return (
    <div>
      <h1 className="page-title">User Management</h1>
      <p className="page-subtitle">Manage students, librarians, and admins.</p>

      <form className="search-bar" onSubmit={handleSearch}>
        <input placeholder="Search by name, email, or register number..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <button className="btn btn-primary">Search</button>
      </form>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="card">
        {users.length === 0 ? (
          <p className="empty-state">No users found.</p>
        ) : (
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value)}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td><span className={`badge ${u.active ? 'badge-available' : 'badge-rejected'}`}>{u.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => handleToggleActive(u)}>
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn btn-danger btn-sm" style={{ marginLeft: 6 }} onClick={() => handleDelete(u)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
