import React from 'react';

export default function StatCard({ label, value, icon, subtitle }) {
  return (
    <div className="card stat-card">
      <div className="stat-value">
        {icon && <span className="stat-icon">{icon}</span>}
        {value}
      </div>
      <div className="stat-label">{label}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </div>
  );
}
