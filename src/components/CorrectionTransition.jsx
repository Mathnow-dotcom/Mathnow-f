import React from 'react';

// Shared entry/exit visual only: no artificial delay or changes to quiz timing.
export default function CorrectionTransition({ error, onRetry, busy = false }) {
  return <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 overflow-auto p-6"
    style={{ background: "#082338 url('/night_sky_landscape.jpg') center / cover" }}>
    <div role="status" aria-label="Preparing your next activity" className="relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center">
      <div aria-hidden="true" className="absolute inset-0 rounded-full bg-cyan-400/10 blur-xl motion-safe:animate-pulse" />
      <div aria-hidden="true" className="absolute inset-0 rounded-full border border-sky-300/20" />
      <div aria-hidden="true" className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 border-r-sky-300/70 motion-safe:animate-spin" />
      <div aria-hidden="true" className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border border-sky-200/20 bg-gradient-to-br from-sky-900/90 to-indigo-950/95 shadow-xl">
        <span className="text-4xl font-bold text-emerald-400">✦</span>
      </div>
    </div>
    {error && <div role="alert" className="max-w-sm rounded-2xl border border-sky-200/20 bg-slate-900/90 p-5 text-center text-white shadow-xl">
      <p>{error}</p>
      <button type="button" onClick={onRetry} disabled={busy}
        className="mt-4 rounded-xl bg-green-600 px-6 py-2 font-bold text-white disabled:cursor-default">Retry</button>
    </div>}
  </div>;
}
