import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { getErrorMessage } from '../../api/axios';
import Alert from '../../components/common/Alert';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authApi.verifyOtp({ email, otp });
      setSuccess('OTP verified successfully!');
      setTimeout(() => navigate('/reset-password', { state: { email, otp } }), 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError('Email not found. Please go back and request again.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authApi.forgotPassword({ email });
      setSuccess('A new OTP has been sent to your email.');
      setResendCooldown(60);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Verify OTP</h1>
          <p>Enter the 6-digit code sent to <strong>{email || 'your email'}</strong></p>
        </div>

        <Alert message={error} />
        <Alert type="success" message={success} />

        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label htmlFor="otp">OTP Code</label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.toUpperCase())}
              placeholder="000000"
              maxLength={6}
              required
              disabled={loading}
              autoComplete="one-time-code"
              className="otp-input"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading || otp.length !== 6}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '20px' }}>
          <button
            type="button"
            className="btn btn-link"
            onClick={handleResend}
            disabled={loading || resendCooldown > 0}
          >
            {resendCooldown > 0
              ? `Resend OTP in ${resendCooldown}s`
              : 'Didn\'t receive the code? Resend OTP'}
          </button>
          <p style={{ marginTop: '16px' }}>
            <Link to="/forgot-password">Request a new code</Link> |
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}