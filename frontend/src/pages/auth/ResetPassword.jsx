import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { getErrorMessage } from '../../api/axios';
import Alert from '../../components/common/Alert';
import Spinner from '../../components/common/Spinner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.otp) {
      setOtp(location.state.otp);
    }
    if (!location.state?.email || !location.state?.otp) {
      navigate('/forgot-password');
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({ email, otp, newPassword, confirmPassword });
      setSuccess('Password has been reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordField = (label, value, onChange, show, onToggleShow, placeholder, fieldId) => (
    <div className="form-group">
      <label htmlFor={fieldId}>{label}</label>
      <div className="password-input-wrapper">
        <input
          id={fieldId}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={loading}
          autoComplete="new-password"
        />
        <button
          type="button"
          className="password-toggle"
          onClick={onToggleShow}
          disabled={loading}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
    </div>
  );

  if (!email || !otp) {
    return (
      <div className="auth-wrapper">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '420px' }}>
        <div className="auth-header">
          <div className="auth-logo">
            <i>🔒</i>
          </div>
          <h1>Create New Password</h1>
          <p className="auth-subtitle">Enter and confirm your new password below. Your new password must be at least 8 characters.</p>
        </div>

        <Alert message={error} />
        <Alert type="success" message={success} />

        {!success && (
          <form onSubmit={handleSubmit}>
            {renderPasswordField(
              'New Password',
              newPassword,
              (e) => setNewPassword(e.target.value),
              showPassword,
              () => setShowPassword(!showPassword),
              'Enter new password (min 8 chars)',
              'newPassword'
            )}

            {renderPasswordField(
              'Confirm New Password',
              confirmPassword,
              (e) => setConfirmPassword(e.target.value),
              showConfirmPassword,
              () => setShowConfirmPassword(!showConfirmPassword),
              'Confirm new password',
              'confirmPassword'
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-switch">
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
