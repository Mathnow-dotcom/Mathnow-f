import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const GameModeIntroScreen = () => {
  const navigate = useNavigate();
  const { setIsGameMode, startOrResumeGameModeRun } =
    useMathGamePick((ctx) => ({
      setIsGameMode: ctx.setIsGameMode || (() => {}),
      startOrResumeGameModeRun: ctx.startOrResumeGameModeRun || (() => Promise.resolve(false)),
    }));

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    (async () => {
      setIsGameMode(true);
      const started = await startOrResumeGameModeRun({
        navigateToGameMode: true,
        gameModeType: 'lightning',
      });

      if (!started) {
        setIsGameMode(false);
        navigate('/belts', { replace: true });
      }
    })();
  }, [navigate, setIsGameMode, startOrResumeGameModeRun]);

  return (
    <>
      <style>{`
        /* Main badge container: gives the sphere its soft breathing presence. */
        .lightning-badge {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 6rem;
          height: 6rem;
          margin: 0 auto 1rem;
          border-radius: 9999px;
          background: radial-gradient(circle at 35% 30%, rgba(255,245,170,0.98), rgba(255,181,58,0.96) 55%, rgba(255,111,0,0.92) 100%);
          box-shadow: 0 0 34px rgba(255,187,61,0.5);
          overflow: visible;
          animation: lightning-badge-pulse 2.1s ease-in-out infinite;
        }

        /* Rotating inner light: creates the feeling of energy revolving inside the sphere. */
        .lightning-badge::before {
          content: '';
          position: absolute;
          inset: -0.22rem;
          border-radius: 9999px;
          background:
            conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,245,190,0.55) 70deg, rgba(255,255,255,0.18) 120deg, rgba(255,255,255,0) 180deg, rgba(255,200,90,0.22) 260deg, rgba(255,255,255,0) 360deg),
            radial-gradient(circle at 30% 28%, rgba(255,255,255,0.28), transparent 42%);
          mix-blend-mode: screen;
          animation: lightning-sphere-rotate 5.2s linear infinite;
          pointer-events: none;
        }

        /* Outer glow halo: expands and softens to keep the badge feeling alive. */
        .lightning-badge::after {
          content: '';
          position: absolute;
          inset: -0.85rem;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(255,214,97,0.35) 0%, rgba(255,170,61,0.18) 42%, rgba(255,170,61,0) 72%);
          filter: blur(8px);
          opacity: 0.85;
          animation: lightning-glow-wave 2.2s ease-in-out infinite;
          pointer-events: none;
        }

        /* Moving highlight layer: adds subtle radial shimmer inside the orb. */
        .lightning-badge-shine {
          position: absolute;
          inset: 10%;
          border-radius: 9999px;
          background:
            radial-gradient(circle at 28% 22%, rgba(255,255,255,0.48), rgba(255,255,255,0.12) 18%, transparent 34%),
            radial-gradient(circle at 68% 72%, rgba(255,227,139,0.22), transparent 36%);
          animation: lightning-shine-drift 4.8s ease-in-out infinite;
          pointer-events: none;
        }

        /* Bolt motion: slight float, scale shift, and a gentle flicker. */
        .lightning-icon {
          position: relative;
          z-index: 1;
          display: inline-block;
          color: #fff;
          line-height: 1;
          text-shadow: 0 8px 20px rgba(255,122,0,0.5);
          animation: lightning-icon-bob 1.45s ease-in-out infinite, lightning-icon-flicker 1.35s ease-in-out infinite;
          transform-origin: center;
        }

        @keyframes lightning-sphere-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes lightning-badge-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 28px rgba(255,187,61,0.42); }
          50% { transform: scale(1.04); box-shadow: 0 0 40px rgba(255,203,92,0.58); }
        }

        @keyframes lightning-glow-wave {
          0%, 100% { transform: scale(0.94); opacity: 0.68; }
          50% { transform: scale(1.08); opacity: 0.96; }
        }

        @keyframes lightning-shine-drift {
          0%, 100% { transform: translate3d(-4%, -4%, 0) rotate(0deg); opacity: 0.8; }
          50% { transform: translate3d(5%, 4%, 0) rotate(12deg); opacity: 1; }
        }

        @keyframes lightning-icon-bob {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.07); }
        }

        @keyframes lightning-icon-flicker {
          0%, 100% { opacity: 1; filter: brightness(1); }
          35% { opacity: 0.96; filter: brightness(1.06); }
          48% { opacity: 1; filter: brightness(1.16); }
          52% { opacity: 0.94; filter: brightness(1.02); }
          70% { opacity: 1; filter: brightness(1.08); }
        }

        @media (min-width: 640px) {
          .lightning-badge {
            width: 7rem;
            height: 7rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .lightning-badge,
          .lightning-badge::before,
          .lightning-badge::after,
          .lightning-badge-shine,
          .lightning-icon {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[100] overflow-auto px-4 py-8 sm:px-6"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, rgba(92, 196, 255, 0.22), transparent 32%), radial-gradient(circle at bottom right, rgba(102, 126, 234, 0.28), transparent 34%), url('/night_sky_landscape.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-slate-950/40" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-300/12 to-transparent" />

        <div className="relative flex min-h-full items-center justify-center py-8">
          <div className="w-full max-w-4xl">
            <div className="rounded-[34px] bg-[linear-gradient(145deg,rgba(116,211,255,0.42),rgba(44,108,255,0.24),rgba(8,18,58,0.74))] p-[1.5px] shadow-[0_24px_60px_rgba(4,12,20,0.6),0_0_30px_rgba(44,108,255,0.18)]">
              <div className="relative overflow-hidden rounded-[32px] border border-[#bfe2ff]/15 bg-[radial-gradient(circle_at_top_left,_rgba(88,148,255,0.2),_rgba(16,36,101,0.94)_38%,_rgba(8,18,58,0.98)_100%)] px-5 py-8 text-center backdrop-blur-md sm:px-8 sm:py-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(126,211,255,0.16),transparent_32%),radial-gradient(circle_at_80%_24%,rgba(67,120,255,0.14),transparent_28%),radial-gradient(circle_at_50%_88%,rgba(34,211,238,0.08),transparent_28%)]" />

                <div className="relative">
                  <div className="lightning-badge">
                    <div className="lightning-badge-shine" />
                    <span className="lightning-icon text-6xl sm:text-7xl">⚡</span>
                  </div>

                  <h2 className="text-4xl font-black uppercase italic tracking-[0.06em] text-white drop-shadow-[0_8px_24px_rgba(44,108,255,0.45)] sm:text-6xl">
                    Lightning
                  </h2>
                  <h1 className="mt-1 text-5xl font-black uppercase tracking-[0.04em] text-[#5fd9ff] drop-shadow-[0_8px_24px_rgba(34,211,238,0.35)] sm:text-7xl">
                    Mode
                  </h1>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3 sm:mt-8 sm:gap-4">
              <div className="h-2.5 w-12 rounded-full bg-cyan-300/85 shadow-[0_0_18px_rgba(103,232,249,0.8)] sm:h-3 sm:w-16" />
              <div
                aria-hidden="true"
                className="h-9 w-9 rounded-full border-[3px] border-cyan-200/40 border-t-cyan-500 animate-spin sm:h-10 sm:w-10"
              />
              <div className="h-2.5 w-12 rounded-full bg-sky-400/85 shadow-[0_0_18px_rgba(56,189,248,0.8)] sm:h-3 sm:w-16" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GameModeIntroScreen;
