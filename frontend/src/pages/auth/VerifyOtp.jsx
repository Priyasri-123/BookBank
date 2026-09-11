import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { getErrorMessage } from '../../api/axios';
import Alert from '../../components/common/Alert';
import Spinner from '../../components/common/Spinner';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      navigate('/forgot-password');
    }
  }, [location, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (value, index) => {
    const newOtp = value;
    setOtp(newOtp);

    if (value && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
    if (!value && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }

    if (newOtp.length === 6) {
      const timer = setTimeout(() => {
        if (inputRefs.current[5]) inputRefs.current[5].blur();
      }, 100);
      return () => clearTimeout(timer);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

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

  const renderOtpInput = (index) => {
    const value = otp[index] || '';
    return (
      <input
        key={index}
        ref={(el) => (inputRefs.current[index] = el)}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={value}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, '');
          const newOtp = otp.split('');
          newOtp[index] = v;
          handleOtpChange(newOtp.join(''), index);
        }}
        onKeyDown={(e) => handleKeyDown(e, index)}
        onClick={() => inputRefs.current[index]?.select()}
        autoComplete="one-time-code"
      />
    );
  };

  if (!email) {
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
            <i>📧</i>
          </div>
          <h1>Verify OTP</h1>
          <p className="auth-subtitle">Enter the 6-digit code sent to <strong>{email}</strong></p>
        </div>

        <Alert message={error} />
        <Alert type="success" message={success} />

        {!success && (
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label htmlFor="otp">OTP Code</label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' }}>
                {[0, 1, 2, 3, 4, 5].map(renderOtpInput)}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        )}

        <div className="auth-switch" style={{ marginTop: '20px' }}>
          {resendCooldown > 0 ? (
            <span style={{ color: 'var(--text-muted)' }}>Resend OTP in {resendCooldown}s</span>
          ) : (
            <button
              type="button"
              className="btn btn-link"
              onClick={handleResend}
              disabled={loading}
              style={{ padding: 0 }}
            >
              Didn't receive the code? Resend OTP
            </button>
          )}
          <div style={{ marginTop: '12px' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.88rem' }}>Request a new code</Link>
            {' | '}
            <Link to="/login" style={{ fontSize: '0.88rem' }}>Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
