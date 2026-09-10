import React, { useEffect, useState } from 'react';
import { settingsApi } from '../../api/settingsApi';
import { getErrorMessage } from '../../api/axios';
import Spinner from '../../components/common/Spinner';
import Alert from '../../components/common/Alert';

export default function SystemSettings() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editValues, setEditValues] = useState({});

  const load = () => {
    settingsApi.getAll()
      .then(({ data }) => {
        setSettings(data);
        const values = {};
        data.forEach((s) => { values[s.key] = s.value; });
        setEditValues(values);
      })
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(load, []);

  const handleSave = async (key) => {
    setError('');
    setSuccess('');
    try {
      await settingsApi.update(key, editValues[key]);
      setSuccess(`${key} updated successfully.`);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (!settings) return error ? <Alert message={error} /> : <Spinner />;

  return (
    <div>
      <h1 className="page-title">System Settings</h1>
      <p className="page-subtitle">
        Configure business rules used across the system, like fine amounts and borrow periods.
        Changes apply immediately without a redeploy.
      </p>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="grid grid-2">
        {settings.map((s) => (
          <div key={s.key} className="card">
            <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>{s.key}</label>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 0 }}>{s.description}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={editValues[s.key] ?? ''}
                onChange={(e) => setEditValues({ ...editValues, [s.key]: e.target.value })}
              />
              <button className="btn btn-primary btn-sm" onClick={() => handleSave(s.key)}>Save</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
