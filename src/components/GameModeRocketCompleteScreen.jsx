import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const GameModeRocketCompleteScreen = () => {
  const navigate = useNavigate();
  const { setIsTimerPaused, setPausedTime } = useMathGamePick((ctx) => ({
    setIsTimerPaused: ctx.setIsTimerPaused || (() => {}),
    setPausedTime: ctx.setPausedTime || (() => {}),
  }));
  const didNavigateRef = useRef(false);

  const goNext = () => {
    if (didNavigateRef.current) return;
    didNavigateRef.current = true;
    navigate('/game-mode-bonus-video-intro', { replace: true });
  };

  useEffect(() => {
    setIsTimerPaused(true);
    setPausedTime(Date.now());
  }, [setIsTimerPaused, setPausedTime]);

  useEffect(() => {
    const timer = setTimeout(() => {
      goNext();
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        .rocket-complete-card {
          animation: rocket-complete-card-in 760ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .rocket-complete-title {
          animation: rocket-complete-title-glow 2.8s ease-in-out infinite;
        }

        .rocket-complete-top-badge {
          animation: rocket-complete-badge-float 2.6s ease-in-out infinite;
        }

        .rocket-complete-button {
          animation: rocket-complete-button-pulse 2.4s ease-in-out infinite;
        }

        .rocket-complete-sparkle {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
          opacity: 0.72;
          animation: rocket-complete-float 7s ease-in-out infinite;
        } 

        .rocket-complete-sparkle::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(103,232,249,0.45) 32%, rgba(103,232,249,0) 72%);
          filter: blur(1px);
        }

        .rocket-complete-banner-wrap {
          position: relative;
          width: 100%;
          max-width: min(42rem, 100%);
          padding-inline: 0.75rem;
        }

        .rocket-complete-banner-wrap::before,
        .rocket-complete-banner-wrap::after {
          content: '';
          position: absolute;
          top: 50%;
          display: none;
          height: 2rem;
          width: 2.75rem;
          transform: translateY(-50%);
          border-radius: 0.5rem;
          background: linear-gradient(180deg, rgba(255,207,57,0.95), rgba(223,127,0,0.95));
          box-shadow: 0 8px 18px rgba(115,59,0,0.22);
          z-index: 0;
        }

        .rocket-complete-banner-wrap::before {
          left: -0.15rem;
          border-top-right-radius: 0.25rem;
          border-bottom-right-radius: 0.25rem;
          transform: translateY(-50%) skewY(-10deg);
        }

        .rocket-complete-banner-wrap::after {
          right: -0.15rem;
          border-top-left-radius: 0.25rem;
          border-bottom-left-radius: 0.25rem;
          transform: translateY(-50%) skewY(10deg);
        }

        .rocket-complete-banner {
          position: relative;
          z-index: 1;
          border-radius: 1.2rem;
          border: 1px solid #ffdf84;
          background: linear-gradient(180deg, #ffd764 0%, #ffbf19 52%, #ef9200 100%);
          box-shadow: inset 0 2px 0 rgba(255,245,190,0.9), 0 10px 22px rgba(115,59,0,0.28);
        }

        @keyframes rocket-complete-card-in {
          0% { opacity: 0; transform: translateY(24px) scale(0.94); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes rocket-complete-title-glow {
          0%, 100% { text-shadow: 0 0 20px rgba(96,165,250,0.18), 0 8px 24px rgba(8,18,58,0.36); }
          50% { text-shadow: 0 0 28px rgba(103,232,249,0.34), 0 10px 28px rgba(16,36,101,0.42); }
        }

        @keyframes rocket-complete-badge-float {
          0%, 100% { transform: translateY(0) scale(1); box-shadow: 0 0 24px rgba(103,232,249,0.34), 0 14px 28px rgba(14,165,233,0.24); }
          50% { transform: translateY(-4px) scale(1.04); box-shadow: 0 0 30px rgba(103,232,249,0.46), 0 18px 34px rgba(14,165,233,0.3); }
        }

        @keyframes rocket-complete-button-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 18px 40px rgba(16,185,129,0.22), 0 0 18px rgba(103,232,249,0.18); }
          50% { transform: scale(1.035); box-shadow: 0 20px 44px rgba(16,185,129,0.28), 0 0 26px rgba(103,232,249,0.26); }
        }

        @keyframes rocket-complete-float {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.45; }
          50% { transform: translate3d(0, -12px, 0) scale(1.08); opacity: 0.9; }
        }

        @media (min-width: 440px) {
          .rocket-complete-banner-wrap::before,
          .rocket-complete-banner-wrap::after {
            display: block;
          }

          .rocket-complete-banner-wrap {
            padding-inline: 1.5rem;
          }
        }

        @media (min-width: 640px) {
          .rocket-complete-banner-wrap::before,
          .rocket-complete-banner-wrap::after {
            width: 3.5rem;
            height: 2.5rem;
          }

          .rocket-complete-banner-wrap::before {
            left: -0.45rem;
          }

          .rocket-complete-banner-wrap::after {
            right: -0.45rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .rocket-complete-card,
          .rocket-complete-title,
          .rocket-complete-top-badge,
          .rocket-complete-button,
          .rocket-complete-sparkle {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>

      <div
        className="fixed inset-0 z-[100] overflow-auto px-4 py-8 sm:px-6"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(5,16,48,0.4), rgba(4,14,38,0.72)), url('/night_sky_landscape.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(103,232,249,0.18),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(96,165,250,0.16),transparent_24%),radial-gradient(circle_at_50%_76%,rgba(34,197,94,0.1),transparent_28%),radial-gradient(circle_at_50%_42%,rgba(129,140,248,0.14),transparent_34%)]" />

        <span className="rocket-complete-sparkle left-[8%] top-[14%] h-2.5 w-2.5" style={{ animationDelay: '0s' }} />
        <span className="rocket-complete-sparkle left-[18%] top-[68%] h-3 w-3" style={{ animationDelay: '1.1s' }} />
        <span className="rocket-complete-sparkle left-[74%] top-[22%] h-2 w-2" style={{ animationDelay: '0.7s' }} />
        <span className="rocket-complete-sparkle left-[84%] top-[58%] h-3.5 w-3.5" style={{ animationDelay: '1.8s' }} />
        <span className="rocket-complete-sparkle left-[58%] top-[12%] h-2.5 w-2.5" style={{ animationDelay: '1.3s' }} />
        <span className="rocket-complete-sparkle left-[38%] top-[78%] h-2 w-2" style={{ animationDelay: '0.4s' }} />

        <div className="relative flex min-h-full items-center justify-center py-8">
          <div className="w-full max-w-4xl">
            <div className="rocket-complete-card rounded-[38px] bg-[linear-gradient(145deg,rgba(120,233,255,0.3),rgba(87,116,255,0.22),rgba(18,25,78,0.72))] p-[1.5px] shadow-[0_26px_70px_rgba(3,10,26,0.7),0_0_34px_rgba(96,165,250,0.18)]">
              <div className="relative overflow-hidden rounded-[36px] bg-[linear-gradient(180deg,rgba(14,27,86,0.88),rgba(10,20,66,0.95))] px-6 py-8 text-center backdrop-blur-xl sm:px-10 sm:py-10 lg:px-12 lg:py-12">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(125,211,252,0.18),transparent_28%),radial-gradient(circle_at_80%_24%,rgba(129,140,248,0.14),transparent_30%),radial-gradient(circle_at_50%_88%,rgba(34,197,94,0.08),transparent_30%)]" />

                <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
                  <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                    <div className="rocket-complete-top-badge flex h-[3.8rem] w-[3.8rem] items-center justify-center rounded-full bg-gradient-to-b from-[#9af4ff] via-[#4cd8ff] to-[#1788d8] text-[1.8rem] shadow-[0_0_24px_rgba(103,232,249,0.45),0_14px_28px_rgba(14,165,233,0.26)] sm:h-[4.7rem] sm:w-[4.7rem] sm:text-[2.2rem]">
                      🚀
                    </div>
                  </div>

                  <div className="rocket-complete-banner-wrap mb-7 mt-6 sm:mt-8">
                    <div className="rocket-complete-banner px-6 py-3 text-center sm:px-10 sm:py-3.5">
                      <div
                        className="font-black uppercase text-white"
                        style={{
                          fontSize: 'clamp(0.94rem, 3.6vw, 2.65rem)',
                          letterSpacing: '0.035em',
                          lineHeight: 1,
                          textShadow: '0 3px 0 rgba(131,67,8,0.42), 0 7px 14px rgba(120,61,6,0.22)',
                        }}
                      >
                        Congratulations
                      </div>
                    </div>
                  </div>

                  <h1 className="rocket-complete-title flex w-full max-w-[40rem] flex-col items-center gap-3 text-center font-black uppercase sm:gap-4">
                    <span className="inline-block max-w-full px-2 text-[clamp(2.1rem,5vw,4.45rem)] leading-none tracking-[0.035em] text-white">
                      Rocket Mode
                    </span>
                    <span className="inline-block max-w-full px-2 text-[clamp(2.45rem,5.9vw,5.25rem)] leading-none tracking-[0.02em] text-[#73ebff] drop-shadow-[0_0_22px_rgba(103,232,249,0.28)]">
                      Completed
                    </span>
                  </h1>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={goNext}
              className="rocket-complete-button mx-auto mt-8 block rounded-[22px] bg-[linear-gradient(145deg,rgba(74,222,128,0.96),rgba(22,163,74,0.96),rgba(20,83,45,0.98))] px-8 py-3.5 text-lg font-black tracking-[0.08em] text-white shadow-[0_18px_40px_rgba(34,197,94,0.26)] transition hover:brightness-110 sm:px-10 sm:py-4 sm:text-xl"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GameModeRocketCompleteScreen;
