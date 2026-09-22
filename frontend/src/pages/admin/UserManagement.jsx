import React, { useEffect, useState } from 'react';
import { userApi } from '../../api/userApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';
import Toast from '../../components/common/Toast';
import Badge from '../../components/common/Badge';
import StudentLibraryDetails from '../../components/admin/StudentLibraryDetails';

const ROLES = ['STUDENT', 'LIBRARIAN', 'ADMIN'];

export default function UserManagement() {
  const [users, setUsers] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const load = (search = '') => {
    userApi.getAll(search)
      .then((res) => { setUsers(res.data); setError(''); })
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(() => load(), []);

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    userApi.getAll(keyword)
      .then((res) => { setUsers(res.data); setError(''); setLoading(false); })
      .catch((err) => { setError(getErrorMessage(err)); setLoading(false); });
  };

  const handleToggleActive = async (user) => {
    try {
      await userApi.updateStatus(user.id, !user.active);
      setToast({ type: 'success', message: `${user.name} ${!user.active ? 'activated' : 'deactivated'}.` });
      load(keyword);
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err) });
    }
  };

  const handleRoleChange = async (user, role) => {
    try {
      await userApi.changeRole(user.id, role);
      setToast({ type: 'success', message: `${user.name}'s role updated to ${role}.` });
      load(keyword);
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err) });
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await userApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      setToast({ type: 'success', message: `${deleteTarget.name} deleted successfully.` });
      load(keyword);
    } catch (err) {
      setToast({ type: 'error', message: getErrorMessage(err) });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">User Management</h1>
      <p className="page-subtitle">Manage students, librarians, and admins.</p>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          placeholder="Search by name, email, or register number..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button className="btn btn-primary" disabled={loading}>Search</button>
      </form>

      {error && <Alert type="error" message={error} />}
      <Toast
        type={toast?.type}
        message={toast?.message}
        onClose={() => setToast(null)}
      />

      <div className="card">
        {users === null ? <Spinner /> : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Register No.</th><th>Role</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">No users found.</div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone || '-'}</td>
                      <td>{u.registerNumber || '-'}</td>
                      <td>
                        <select value={u.role} onChange={(e) => handleRoleChange(u, e.target.value)}>
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${u.active ? 'badge-available' : 'badge-rejected'}`}>
                          {u.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td>
                        {u.role === 'STUDENT' && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ marginLeft: 6 }}
                            onClick={() => setDetailsTarget(u)}
                          >
                            View Details
                          </button>
                        )}
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleToggleActive(u)}
                          disabled={loading}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ marginLeft: 6 }}
                          onClick={() => setDeleteTarget(u)}
                          disabled={deleting}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Delete User</h2>
              <button className="modal-close" onClick={() => setDeleteTarget(null)} aria-label="Close">✕</button>
            </div>
            <p style={{ margin: '12px 0' }}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsTarget && (
        <div className="modal-overlay" onClick={() => setDetailsTarget(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Student Library Details</h2>
              <button className="modal-close" onClick={() => setDetailsTarget(null)} aria-label="Close">✕</button>
            </div>
            <div style={{ maxHeight: '80vh', overflowY: 'auto', padding: '4px 0' }}>
              <StudentLibraryDetails studentId={detailsTarget.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
