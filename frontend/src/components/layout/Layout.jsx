import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div>
      <Navbar />
      <div className="app-shell">
        <Sidebar />
        <div className="main-content">{children}</div>
      </div>
    </div>
  );
}
