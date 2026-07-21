import React, { useEffect, useRef } from 'react';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const GameModeBonusIntroScreen = () => {
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
        gameModeType: 'bonus',
        navigateToGameMode: true,
        suppressStartError: true,
      });

      if (!started) {
        navigate('/belts', { replace: true });
      }
    })();
  }, [startOrResumeGameModeRun, navigate, setIsTimerPaused, setPausedTime]);

  return (
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
          <div className="rounded-[32px] border border-[#bfe2ff]/15 bg-[radial-gradient(circle_at_top_left,_rgba(88,148,255,0.2),_rgba(16,36,101,0.94)_38%,_rgba(8,18,58,0.98)_100%)] px-8 py-12 text-center backdrop-blur-md sm:px-12">
            <h1 className="text-5xl sm:text-7xl font-black tracking-[0.08em] text-white drop-shadow-[0_6px_18px_rgba(6,14,40,0.5)]">
              BONUS MODE
            </h1>
          </div>
        </div>
      </div>
      <div className="mt-8" aria-hidden="true">
        <div className="h-12 w-12 rounded-full border-4 border-[#bfe2ff]/30 border-t-[#74d3ff] animate-spin shadow-[0_0_18px_rgba(116,211,255,0.24)]" />
      </div>
    </div>
  );
};

export default GameModeBonusIntroScreen;
