import React, { useEffect } from 'react';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const PretestIntroScreen = () => {
  const { isPretest, selectedTable, navigate, isQuittingRef } =
    useMathGamePick((ctx) => ({
      isPretest: Boolean(ctx.isPretest),
      selectedTable: ctx.selectedTable,
      navigate: ctx.navigate || (() => {}),
      isQuittingRef: ctx.isQuittingRef || { current: false },
    }));

  useEffect(() => {
    if (!isPretest) {
      if (isQuittingRef?.current) {
        navigate('/', { replace: true });
        return;
      }
      navigate('/levels', { replace: true });
    }
  }, [isPretest, navigate, isQuittingRef]);

  if (!isPretest) return null;

  const levelLabel = selectedTable ?? '_';

  return (
    <>
      <div
        className="min-h-screen w-full fixed inset-0 flex flex-col items-center justify-center p-4 overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(4,20,44,0.44), rgba(2,14,34,0.74)), url('/night_sky_landscape.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(159,244,255,0.18),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(45,212,191,0.16),transparent_24%),radial-gradient(circle_at_50%_82%,rgba(34,211,238,0.12),transparent_28%)]" />

        <div className="relative w-full max-w-[560px] md:max-w-[700px] lg:max-w-[820px] xl:max-w-[900px]">
          <div className="absolute -top-10 -right-8 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl" />
          <div className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-teal-300/18 blur-2xl" />

          <div className="rounded-[28px] md:rounded-[32px] bg-[linear-gradient(145deg,rgba(123,240,255,0.34),rgba(18,163,186,0.22),rgba(4,30,65,0.82))] p-[1.5px] shadow-[0_24px_60px_rgba(4,18,26,0.62),0_0_30px_rgba(45,212,191,0.14)]">
            {/* Added: flex flex-col justify-center to vertically center content in the min-height container */}
            <div className="relative flex flex-col justify-center min-h-[220px] md:min-h-[260px] lg:min-h-[300px] overflow-hidden rounded-[26px] md:rounded-[30px] border border-[#c6fbff]/15 bg-[radial-gradient(circle_at_top_left,_rgba(110,245,255,0.14),_rgba(7,42,88,0.95)_38%,_rgba(5,20,52,0.99)_100%)] backdrop-blur-md">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(165,243,252,0.14),transparent_30%),radial-gradient(circle_at_80%_24%,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_50%_88%,rgba(45,212,191,0.08),transparent_28%)]" />
              <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-cyan-300/14 blur-3xl" />
              <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-teal-300/12 blur-3xl" />

              <span className="pointer-events-none absolute top-3 left-4 text-cyan-100/60 text-xl font-black animate-pulse">
                +
              </span>
              <span className="pointer-events-none absolute top-4 right-5 text-teal-100/55 text-xl font-black animate-pulse">
                -
              </span>
              <span className="pointer-events-none absolute bottom-14 left-5 text-cyan-100/55 text-xl font-black animate-pulse">
                ×
              </span>
              <span className="pointer-events-none absolute bottom-14 right-5 text-sky-100/60 text-xl font-black animate-pulse">
                ÷
              </span>

              {/* Added: w-full to ensure it respects the flex parent width correctly */}
              <div className="relative w-full p-4 sm:p-5 md:p-7 lg:p-8">
                <div className="mx-auto mb-4 w-full rounded-2xl md:rounded-3xl border border-[#c6fbff]/15 bg-black/28 px-4 py-4 sm:px-5 sm:py-4 md:px-7 md:py-5 lg:px-8 lg:py-6 shadow-[inset_0_0_24px_rgba(45,212,191,0.1)]">
                  <h2
                    className="mx-auto w-full max-w-[15ch] text-center font-extrabold tracking-tight text-[#7df5ff] whitespace-normal break-words leading-[1.04] drop-shadow-[0_4px_14px_rgba(125,245,255,0.16)] text-[clamp(1.65rem,7vw,2.65rem)] sm:text-[clamp(2.25rem,5.1vw,3.7rem)] lg:text-[clamp(2.8rem,4.4vw,4.6rem)]"
                    style={{ fontFamily: 'Baloo 2, Comic Neue, cursive' }}
                  >
                    <span className="block whitespace-normal break-words">
                      {`LEVEL ${levelLabel} PREVIEW`}
                    </span>
                  </h2>
                </div>

                <p
                  className="mx-auto w-full max-w-fit px-2 text-center font-extrabold tracking-tight text-white whitespace-nowrap leading-none text-[clamp(0.7rem,1.7vw,1.6rem)] sm:text-[clamp(0.9rem,1.55vw,1.55rem)] md:text-[clamp(1rem,1.35vw,1.7rem)]"
                  style={{ fontFamily: 'Baloo 2, Comic Neue, cursive' }}
                >
                  ANSWER AS FAST AS YOU CAN
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8" aria-hidden="true">
          <div className="relative h-11 w-11 md:h-14 md:w-14">
            <div className="absolute inset-0 rounded-full border-[3px] border-[#c6fbff]/20" />
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#7df5ff] border-r-[#2dd4bf] animate-spin" />
            <div className="absolute inset-[9px] rounded-full bg-cyan-300/28 animate-pulse" />
          </div>
        </div>
      </div>
    </>
  );
};

export default PretestIntroScreen;
