import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { getErrorMessage } from '../../api/axios';
import Alert from '../../components/common/Alert';

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
  }, [location]);

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

  const renderPasswordField = (label, value, onChange, show, onToggleShow, placeholder) => (
    <div className="form-group password-field">
      <label>{label}</label>
      <div className="password-input-wrapper">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={loading}
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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Reset Password</h1>
          <p>Create a new password for your account</p>
        </div>

        <Alert message={error} />
        <Alert type="success" message={success} />

        <form onSubmit={handleSubmit}>
          {renderPasswordField(
            'New Password',
            newPassword,
            (e) => setNewPassword(e.target.value),
            showPassword,
            () => setShowPassword(!showPassword),
            'Enter new password (min 8 chars)'
          )}

          {renderPasswordField(
            'Confirm New Password',
            confirmPassword,
            (e) => setConfirmPassword(e.target.value),
            showConfirmPassword,
            () => setShowConfirmPassword(!showConfirmPassword),
            'Confirm new password'
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer">
          <p><Link to="/login">Back to login</Link></p>
        </div>
      </div>
    </div>
  );
}