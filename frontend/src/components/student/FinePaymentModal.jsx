import React, { useState } from 'react';

const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'card', label: 'Debit/Credit Card', icon: '💳' },
  { value: 'netbanking', label: 'Net Banking', icon: '🏦' },
];

function generateDemoTxnId() {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DEMO-${ts}${rand}`;
}

export default function FinePaymentModal({ fine, onClose, onPaid }) {
  const [method, setMethod] = useState('upi');
  const [step, setStep] = useState('form'); // 'form' | 'processing' | 'success'
  const [error, setError] = useState('');
  const [txnId, setTxnId] = useState('');

  const amount = Number(fine.fineAmount) || 0;
  const overdueDays = fine.overdueDays || 0;
  const finePerDay = Number(fine.finePerDay) || 5;

  const handlePay = () => {
    setError('');
    setStep('processing');
    setTimeout(() => {
      if (Math.random() < 0.08) {
        setError('Demo simulator: payment declined. Please try again.');
        setStep('form');
        return;
      }
      setTxnId(generateDemoTxnId());
      setStep('success');
    }, 900);
  };

  const handleConfirmPaid = async () => {
    await onPaid(fine.id, txnId);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="demo-badge">Demo Payment</span>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Pay Outstanding Fine</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <p className="demo-note">
          <strong>Demo Payment – No real money is transferred.</strong> No sensitive payment data
          is collected or stored.
        </p>

        <div className="fine-summary">
          <div className="fine-summary-row">
            <span>Book</span>
            <strong>{fine.bookTitle}</strong>
          </div>
          <div className="fine-summary-row">
            <span>Due Date</span>
            <strong>{formatDate(fine.dueDate)}</strong>
          </div>
          <div className="fine-summary-row">
            <span>Overdue Days</span>
            <strong>{overdueDays} day(s)</strong>
          </div>
          <div className="fine-summary-row">
            <span>Fine Rate</span>
            <strong>₹{fmt(finePerDay)}/day</strong>
          </div>
          <div className="fine-summary-row fine-summary-total">
            <span>Amount</span>
            <strong>₹{amount.toFixed(2)}</strong>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {step === 'form' && (
          <>
            <div className="form-group">
              <label>Payment method</label>
              <div className="pay-methods">
                {PAYMENT_METHODS.map((m) => (
                  <label key={m.value} className="pay-method">
                    <input
                      type="radio"
                      name="method"
                      checked={method === m.value}
                      onChange={() => setMethod(m.value)}
                    />
                    <span className="pay-method-label">
                      <span className="pay-method-icon">{m.icon}</span>
                      {m.label}
                    </span>
                  </label>
                ))}
              </div>
              <p className="help-text">
                Demo mode: no real payment details are required or collected. Select {method} to continue.
              </p>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handlePay}>
              Pay ₹{fmt(amount)}
            </button>
          </>
        )}

        {step === 'processing' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="spinner-inline" />
            <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Processing Payment…</p>
          </div>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div className="success-check">✓</div>
            <h3 style={{ margin: '12px 0 6px', color: 'var(--success)' }}>✓ Fine Paid</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Transaction ID: <strong>{txnId}</strong>
            </p>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Amount Paid: <strong>₹{amount.toFixed(2)}</strong>
            </p>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Payment Date: <strong>{new Date().toLocaleString()}</strong>
            </p>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Payment Status: <strong>Paid</strong>
            </p>
            <p className="demo-note" style={{ marginTop: 12, marginBottom: 16 }}>
              Demo transaction — no real money was transferred.
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleConfirmPaid}>
              Done
            </button>
          </div>
        )}

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <button className="btn btn-link" onClick={onClose}>
            Cancel / Keep Fine Unpaid
          </button>
        </div>
      </div>
    </div>
  );
}

function fmt(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return '-';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value + 'T00:00:00').toLocaleDateString();
  }
  return new Date(value).toLocaleDateString();
}
