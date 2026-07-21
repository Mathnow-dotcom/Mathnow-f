// src/components/ui/TopStreakCounter.jsx
import React from 'react';
import { useMathGameSelector } from '../../store/mathGameBridgeStore.js';

const DailyStreakCounter = () => {
  const currentStreak = useMathGameSelector((ctx) => ctx.currentStreak ?? 0);

  if (currentStreak === 0) return null;

  return (
    <div className="relative z-50 shrink-0 overflow-hidden rounded-full bg-[radial-gradient(circle_at_top_left,_rgba(88,148,255,0.18),_rgba(16,36,101,0.94)_36%,_rgba(8,18,58,0.98)_100%)] px-3 py-2 text-white shadow-[0_12px_26px_rgba(5,16,54,0.42),0_0_18px_rgba(44,108,255,0.16)] transition-all duration-300 active:scale-95">
      <div className="pointer-events-none absolute inset-y-1 right-1 w-10 rounded-full bg-[radial-gradient(circle,_rgba(99,179,255,0.14),_transparent_72%)] blur-lg" />
      <div className="relative flex items-center gap-1.5">
        <span className="text-xl leading-none">{'\u{1F525}'}</span>
        <span className="text-base font-bold tabular-nums">{currentStreak}</span>
      </div>
    </div>
  );
};

export default DailyStreakCounter;
