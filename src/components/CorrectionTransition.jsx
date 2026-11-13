import React from 'react';
import AdminBrand from './admin/AdminBrand.jsx';
import '../styles/ClassroomTransitions.css';
import '../styles/ActiveRun.css';

// Shared entry/exit visual only: no artificial delay or changes to quiz timing.
export default function CorrectionTransition({ error, onRetry, busy = false, foreground = false }) {
  return <div className={`classroom-active-page classroom-activity-loading fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 overflow-auto p-6${foreground ? ' activity-loading-foreground' : ''}`}>
    <AdminBrand className="classroom-screen-brand" />
    <div role="status" aria-label="Preparing your next activity" className="activity-loading-card">
      <div className="activity-loading-spinner" aria-hidden="true">
        <div className="activity-loading-ring" />
        <div className="activity-loading-center">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M12 3h8M16 3v4M24 8l3-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="19" r="10" stroke="currentColor" strokeWidth="2.5" />
            <path d="M16 13v6l4 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      <p className="activity-loading-label">Getting ready…</p>
      <div className="activity-loading-dots" aria-hidden="true"><span /><span /><span /></div>
    </div>
    {error && <div role="alert" className="max-w-sm rounded-2xl border border-sky-200 bg-white p-5 text-center text-[#173f70] shadow-xl">
      <p>{error}</p>
      <button type="button" onClick={onRetry} disabled={busy}
        className="mt-4 rounded-xl bg-green-600 px-6 py-2 font-bold text-white disabled:cursor-default">Retry</button>
    </div>}
  </div>;
}
