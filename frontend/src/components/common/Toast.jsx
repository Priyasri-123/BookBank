import React, { useEffect } from 'react';

export default function Toast({ type = 'success', message, onClose, duration = 4500 }) {
  useEffect(() => {
    if (!message || !onClose) return undefined;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [message, onClose, duration]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type}`} role="status">
      <span className="toast-icon">{type === 'error' ? '!' : '✓'}</span>
      <span>{message}</span>
      <button type="button" className="toast-close" onClick={onClose} aria-label="Close notification">
        ×
      </button>
    </div>
  );
}
