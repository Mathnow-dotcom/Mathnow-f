import React from 'react';

const StatsCardShell = ({ style, icon, label, value, status }) => {
  const statusText =
    status === 'paused' ? 'Paused' : status === 'idle' ? 'Not Started' : '';

  return (
    <div style={style}>
      <div className="relative w-full min-w-0 overflow-hidden rounded-[1.2rem] bg-[radial-gradient(circle_at_top_left,_rgba(88,148,255,0.18),_rgba(16,36,101,0.94)_36%,_rgba(8,18,58,0.98)_100%)] px-3 py-3 text-white shadow-[0_12px_26px_rgba(5,16,54,0.42),0_0_18px_rgba(44,108,255,0.16),inset_0_1px_0_rgba(194,225,255,0.16)] sm:min-w-[220px] sm:px-4 sm:py-3.5 md:min-w-[250px]">
        <div className="pointer-events-none absolute inset-y-3 right-3 w-20 rounded-full bg-[radial-gradient(circle,_rgba(99,179,255,0.14),_transparent_72%)] blur-xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center text-[1.9rem] sm:h-14 sm:w-14 sm:text-[2.1rem]">
            <span aria-hidden="true">{icon}</span>
          </div>
          <div className="min-w-0">
            <div className="text-[0.78rem] font-semibold tracking-[0.01em] text-[#74d3ff] sm:text-[0.92rem]">
              {label}
            </div>
            <div className="text-[1rem] font-black leading-tight text-white sm:text-[1.22rem]">
              {value}
            </div>
            {statusText ? (
              <div className="pt-0.5 text-[0.72rem] font-medium uppercase tracking-[0.08em] text-white/60">
                {statusText}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCardShell;
