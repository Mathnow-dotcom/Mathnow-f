import React from 'react';
import '../../styles/AdminTheme.css';

const AdminBrand = ({ className = '' }) => (
  <div className={`admin-brand ${className}`.trim()} aria-label="MathNow">
    <span className="admin-brand__mark" aria-hidden="true">
      <svg viewBox="0 0 64 70" role="img">
        <path className="admin-brand__clock-knob" d="M27 3h10v10H27z" />
        <circle className="admin-brand__clock-face" cx="32" cy="39" r="26" />
        <path className="admin-brand__clock-hands" d="M32 39 22 24M32 39 45 17" />
        <circle className="admin-brand__clock-pin" cx="32" cy="39" r="3.2" />
      </svg>
    </span>
    <span className="admin-brand__word">
      <span className="admin-brand__math">Math</span><strong>Now</strong>
    </span>
  </div>
);

export default AdminBrand;
