import React from 'react';

export default function Badge({ status }) {
  if (!status) return null;
  return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;
}
