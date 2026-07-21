import React, { useEffect, useRef } from 'react';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const GameModeRocketIntroScreen = () => {
  const { startOrResumeGameModeRun, navigate, setIsTimerPaused, setPausedTime } =
    useMathGamePick((ctx) => ({
      startOrResumeGameModeRun: ctx.startOrResumeGameModeRun || (() => Promise.resolve(false)),
      navigate: ctx.navigate || (() => {}),
      setIsTimerPaused: ctx.setIsTimerPaused || (() => {}),
      setPausedTime: ctx.setPausedTime || (() => {}),
    }));
  const didStartRef = useRef(false);

  useEffect(() => {
    if (didStartRef.current) return;
    didStartRef.current = true;

    setIsTimerPaused(true);
    setPausedTime(Date.now());

    (async () => {
      const started = await startOrResumeGameModeRun({
        gameModeType: 'rocket',
        navigateToGameMode: true,
        suppressStartError: true,
      });

      if (!started) {
        navigate('/game-mode-exit', { replace: true });
      }
    })();
  }, [startOrResumeGameModeRun, navigate, setIsTimerPaused, setPausedTime]);

  return (
    <>
      <style>{`
        .rocket-badge {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 6rem;
          height: 6rem;
          margin: 0 auto 1rem;
          border-radius: 9999px;
          background: radial-gradient(circle at 35% 30%, rgba(255,234,204,0.98), rgba(255,153,72,0.96) 55%, rgba(120,45,18,0.92) 100%);
          box-shadow: 0 0 34px rgba(251,146,60,0.42);
          overflow: visible;
          animation: rocket-badge-pulse 2.4s ease-in-out infinite;
        }

        .rocket-badge::before {
          content: '';
          position: absolute;
          inset: -0.22rem;
          border-radius: 9999px;
          background:
            conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(254,215,170,0.48) 72deg, rgba(255,255,255,0.16) 120deg, rgba(255,255,255,0) 180deg, rgba(251,146,60,0.24) 258deg, rgba(255,255,255,0) 360deg),
            radial-gradient(circle at 30% 28%, rgba(255,255,255,0.24), transparent 42%);
          mix-blend-mode: screen;
          animation: rocket-sphere-rotate 6.2s linear infinite;
          pointer-events: none;
        }

        .rocket-badge::after {
          content: '';
          position: absolute;
          inset: -0.9rem;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(251,191,36,0.34) 0%, rgba(249,115,22,0.18) 42%, rgba(249,115,22,0) 72%);
          filter: blur(10px);
          opacity: 0.85;
          animation: rocket-glow-wave 2.5s ease-in-out infinite;
          pointer-events: none;
        }

        .rocket-badge-shine {
          position: absolute;
          inset: 10%;
          border-radius: 9999px;
          background:
            radial-gradient(circle at 28% 22%, rgba(255,255,255,0.46), rgba(255,255,255,0.12) 18%, transparent 34%),
            radial-gradient(circle at 68% 72%, rgba(253,186,116,0.24), transparent 36%);
          animation: rocket-shine-drift 5.1s ease-in-out infinite;
          pointer-events: none;
        }

        .rocket-trail {
          position: absolute;
          bottom: 8%;
          left: 50%;
          width: 18%;
          height: 28%;
          transform: translateX(-50%);
          background: linear-gradient(180deg, rgba(255,244,214,0.92), rgba(251,146,60,0.65) 48%, rgba(234,88,12,0) 100%);
          clip-path: polygon(50% 0%, 74% 36%, 62% 100%, 38% 100%, 26% 36%);
          filter: blur(2px);
          opacity: 0.88;
          animation: rocket-trail-flicker 1.3s ease-in-out infinite;
          pointer-events: none;
        }

        .rocket-icon {
          position: relative;
          z-index: 1;
          display: inline-block;
          color: #fff7ed;
          line-height: 1;
          text-shadow: 0 8px 20px rgba(120,53,15,0.42);
          animation: rocket-icon-bob 1.7s ease-in-out infinite, rocket-icon-flicker 1.55s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes rocket-sphere-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes rocket-badge-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 28px rgba(251,146,60,0.36); }
          50% { transform: scale(1.04); box-shadow: 0 0 40px rgba(251,191,36,0.5); }
        }

        @keyframes rocket-glow-wave {
          0%, 100% { transform: scale(0.94); opacity: 0.68; }
          50% { transform: scale(1.08); opacity: 0.96; }
        }

        @keyframes rocket-shine-drift {
          0%, 100% { transform: translate3d(-4%, -4%, 0) rotate(0deg); opacity: 0.8; }
          50% { transform: translate3d(5%, 4%, 0) rotate(10deg); opacity: 1; }
        }

        @keyframes rocket-trail-flicker {
          0%, 100% { transform: translateX(-50%) scaleY(1); opacity: 0.86; }
          50% { transform: translateX(-50%) scaleY(1.12); opacity: 1; }
        }

        @keyframes rocket-icon-bob {
          0%, 100% { transform: translateY(0) rotate(-3deg) scale(1); }
          50% { transform: translateY(-4px) rotate(2deg) scale(1.05); }
        }

        @keyframes rocket-icon-flicker {
          0%, 100% { opacity: 1; filter: brightness(1); }
          35% { opacity: 0.97; filter: brightness(1.05); }
          50% { opacity: 1; filter: brightness(1.12); }
          68% { opacity: 0.95; filter: brightness(1.02); }
        }

        @media (min-width: 640px) {
          .rocket-badge {
            width: 7rem;
            height: 7rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .rocket-badge,
          .rocket-badge::before,
          .rocket-badge::after,
          .rocket-badge-shine,
          .rocket-trail,
          .rocket-icon {
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
                <div className="rocket-badge">
                  <div className="rocket-badge-shine" />
                  <div className="rocket-trail" />
                  <span className="rocket-icon text-5xl sm:text-6xl">🚀</span>
                </div>

                <h1 className="mx-auto w-full max-w-[32rem] whitespace-nowrap text-center text-[clamp(2rem,5.4vw,4.6rem)] font-black uppercase italic tracking-[0.02em] text-white drop-shadow-[0_8px_24px_rgba(44,108,255,0.45)] sm:max-w-[36rem] sm:text-[clamp(2.4rem,5.8vw,5rem)]">
                  <span className="text-white">Rocket </span>
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

export default GameModeRocketIntroScreen;
