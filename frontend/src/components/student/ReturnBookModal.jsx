import React from 'react';

export default function ReturnBookModal({ bookTitle, onClose, onConfirm }) {
  const [confirming, setConfirming] = React.useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
    } catch {
      setConfirming(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Return Book</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p style={{ margin: '12px 0' }}>
          Are you sure you want to return <strong>{bookTitle}</strong>?
        </p>
        <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          This action cannot be undone. The book status will be updated accordingly.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={confirming}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={confirming}>
            {confirming ? 'Returning...' : 'Confirm Return'}
          </button>
        </div>
      </div>
    </div>
  );
}
