import React, { useEffect, useRef } from 'react';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const GameModeSurfIntroScreen = () => {
  const { startOrResumeGameModeRun, setIsTimerPaused, setPausedTime } = useMathGamePick((ctx) => ({
    startOrResumeGameModeRun: ctx.startOrResumeGameModeRun || (() => Promise.resolve(false)),
    setIsTimerPaused: ctx.setIsTimerPaused || (() => {}),
    setPausedTime: ctx.setPausedTime || (() => {}),
  }));
  const didStartRef = useRef(false);

  useEffect(() => {
    if (didStartRef.current) return;
    didStartRef.current = true;
    setIsTimerPaused(true);
    setPausedTime(Date.now());
    startOrResumeGameModeRun({ gameModeType: 'surf', navigateToGameMode: true }).catch((e) => {
      console.error('[SurfIntro] Failed to start surf mode:', e);
    });
  }, [startOrResumeGameModeRun, setIsTimerPaused, setPausedTime]);

  return (
    <>
      <style>{`
        .surf-badge {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 6rem;
          height: 6rem;
          margin: 0 auto 1rem;
          border-radius: 9999px;
          background: radial-gradient(circle at 35% 30%, rgba(203,250,255,0.98), rgba(82,222,255,0.96) 55%, rgba(9,118,184,0.92) 100%);
          box-shadow: 0 0 34px rgba(56,189,248,0.42);
          overflow: visible;
          animation: surf-badge-pulse 2.4s ease-in-out infinite;
        }

        .surf-badge::before {
          content: '';
          position: absolute;
          inset: -0.22rem;
          border-radius: 9999px;
          background:
            conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(186,230,253,0.5) 72deg, rgba(255,255,255,0.16) 120deg, rgba(255,255,255,0) 180deg, rgba(34,211,238,0.24) 258deg, rgba(255,255,255,0) 360deg),
            radial-gradient(circle at 30% 28%, rgba(255,255,255,0.24), transparent 42%);
          mix-blend-mode: screen;
          animation: surf-sphere-rotate 6.2s linear infinite;
          pointer-events: none;
        }

        .surf-badge::after {
          content: '';
          position: absolute;
          inset: -0.9rem;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(125,211,252,0.34) 0%, rgba(34,211,238,0.18) 42%, rgba(34,211,238,0) 72%);
          filter: blur(10px);
          opacity: 0.85;
          animation: surf-glow-wave 2.5s ease-in-out infinite;
          pointer-events: none;
        }

        .surf-badge-shine {
          position: absolute;
          inset: 10%;
          border-radius: 9999px;
          background:
            radial-gradient(circle at 28% 22%, rgba(255,255,255,0.46), rgba(255,255,255,0.12) 18%, transparent 34%),
            radial-gradient(circle at 68% 72%, rgba(103,232,249,0.24), transparent 36%);
          animation: surf-shine-drift 5.1s ease-in-out infinite;
          pointer-events: none;
        }

        .surf-wave {
          position: absolute;
          bottom: 14%;
          left: 14%;
          width: 72%;
          height: 26%;
          border-radius: 9999px;
          background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(103,232,249,0.22));
          filter: blur(1px);
          clip-path: polygon(0% 60%, 8% 45%, 18% 58%, 30% 38%, 42% 57%, 54% 42%, 66% 61%, 78% 44%, 90% 56%, 100% 48%, 100% 100%, 0% 100%);
          animation: surf-wave-sway 2.8s ease-in-out infinite;
          pointer-events: none;
        }

        .surf-icon {
          position: relative;
          z-index: 1;
          display: inline-block;
          color: #effbff;
          line-height: 1;
          text-shadow: 0 8px 20px rgba(8,47,73,0.42);
          animation: surf-icon-bob 1.7s ease-in-out infinite, surf-icon-flicker 1.55s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes surf-sphere-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes surf-badge-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 28px rgba(56,189,248,0.36); }
          50% { transform: scale(1.04); box-shadow: 0 0 40px rgba(103,232,249,0.54); }
        }

        @keyframes surf-glow-wave {
          0%, 100% { transform: scale(0.94); opacity: 0.68; }
          50% { transform: scale(1.08); opacity: 0.96; }
        }

        @keyframes surf-shine-drift {
          0%, 100% { transform: translate3d(-4%, -4%, 0) rotate(0deg); opacity: 0.8; }
          50% { transform: translate3d(5%, 4%, 0) rotate(10deg); opacity: 1; }
        }

        @keyframes surf-wave-sway {
          0%, 100% { transform: translateY(0) scaleX(1); opacity: 0.72; }
          50% { transform: translateY(2px) scaleX(1.04); opacity: 0.96; }
        }

        @keyframes surf-icon-bob {
          0%, 100% { transform: translateY(0) rotate(-4deg) scale(1); }
          50% { transform: translateY(-3px) rotate(3deg) scale(1.05); }
        }

        @keyframes surf-icon-flicker {
          0%, 100% { opacity: 1; filter: brightness(1); }
          35% { opacity: 0.97; filter: brightness(1.05); }
          50% { opacity: 1; filter: brightness(1.12); }
          68% { opacity: 0.95; filter: brightness(1.02); }
        }

        @media (min-width: 640px) {
          .surf-badge {
            width: 7rem;
            height: 7rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .surf-badge,
          .surf-badge::before,
          .surf-badge::after,
          .surf-badge-shine,
          .surf-wave,
          .surf-icon {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center animate-fade-in-up overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(5,16,48,0.42), rgba(4,14,38,0.68)), url('/night_sky_landscape.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(126,211,255,0.24),transparent_32%),radial-gradient(circle_at_80%_24%,rgba(67,120,255,0.2),transparent_28%),radial-gradient(circle_at_50%_78%,rgba(34,211,238,0.12),transparent_32%)]" />
        <div className="relative w-full max-w-[760px] px-6">
          <div className="rounded-[34px] bg-[linear-gradient(145deg,rgba(116,211,255,0.42),rgba(44,108,255,0.24),rgba(8,18,58,0.74))] p-[1.5px] shadow-[0_24px_60px_rgba(4,12,20,0.6),0_0_30px_rgba(44,108,255,0.18)]">
            <div className="relative overflow-hidden rounded-[32px] border border-[#bfe2ff]/15 bg-[radial-gradient(circle_at_top_left,_rgba(88,148,255,0.2),_rgba(16,36,101,0.94)_38%,_rgba(8,18,58,0.98)_100%)] px-8 py-10 text-center backdrop-blur-md sm:px-12 sm:py-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(126,211,255,0.16),transparent_32%),radial-gradient(circle_at_80%_24%,rgba(67,120,255,0.14),transparent_28%),radial-gradient(circle_at_50%_88%,rgba(34,211,238,0.08),transparent_28%)]" />

              <div className="relative">
                <div className="surf-badge">
                  <div className="surf-badge-shine" />
                  <div className="surf-wave" />
                  <span className="surf-icon text-5xl sm:text-6xl">🏄</span>
                </div>

                <h1 className="mx-auto max-w-full whitespace-nowrap text-[clamp(2.4rem,7vw,5.4rem)] font-black uppercase italic tracking-[0.04em] text-white drop-shadow-[0_8px_24px_rgba(44,108,255,0.45)]">
                  <span className="text-white">Surf </span>
                  <span className="text-[#5fd9ff] drop-shadow-[0_8px_24px_rgba(34,211,238,0.35)]">Mode</span>
                </h1>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8" aria-hidden="true">
          <div className="h-12 w-12 rounded-full border-4 border-[#bfe2ff]/30 border-t-[#74d3ff] animate-spin shadow-[0_0_18px_rgba(116,211,255,0.24)]" />
        </div>
      </div>
    </>
  );
};

export default GameModeSurfIntroScreen;
