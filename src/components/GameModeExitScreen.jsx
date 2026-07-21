import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getOperationMaxLevel,
  normalizeOperation,
} from '../config/modulesConfig.js';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const GAME_MODE_EXIT_TARGET_KEY = 'game-mode-exit-target';

const getExitRouteFromBelt = (belt, { isLastLevelInOperation = false } = {}) => {
  if (!belt) return null;

  const lowerBelt = String(belt).toLowerCase();
  if (lowerBelt === 'brown') return '/black';

  if (lowerBelt.includes('black')) {
    const parts = lowerBelt.split('-');
    const degree = parts.length > 1 ? parseInt(parts[1], 10) : 0;
    return degree === 7 ? (isLastLevelInOperation ? '/operations' : '/levels') : '/black';
  }

  return '/belts';
};

const GameModeExitScreen = () => {
  const navigate = useNavigate();
  const {
    setIsQuizStarting,
    hardResetQuizState,
    gameModeType,
    selectedDifficulty,
    selectedOperation,
    selectedTable,
    operationsMeta,
    setIsTimerPaused,
    setPausedTime,
    setQuizStartTime,
  } = useMathGamePick((ctx) => ({
    setIsQuizStarting: ctx.setIsQuizStarting || (() => {}),
    hardResetQuizState: ctx.hardResetQuizState || (() => {}),
    gameModeType: ctx.gameModeType || null,
    selectedDifficulty: ctx.selectedDifficulty || null,
    selectedOperation: ctx.selectedOperation || null,
    selectedTable: ctx.selectedTable || null,
    operationsMeta: ctx.operationsMeta || {},
    setIsTimerPaused: ctx.setIsTimerPaused || (() => {}),
    setPausedTime: ctx.setPausedTime || (() => {}),
    setQuizStartTime: ctx.setQuizStartTime || (() => {}),
  }));
  const resolvedRouteRef = useRef(null);
  const initialGameModeTypeRef = useRef(gameModeType || null);
  const timeoutRef = useRef(null);
  const hardResetRef = useRef(hardResetQuizState);
  const setIsQuizStartingRef = useRef(setIsQuizStarting);
  const modeLabel = initialGameModeTypeRef.current === 'bonus' ? 'BONUS' : 'ROCKET';
  const isBonusMode = initialGameModeTypeRef.current === 'bonus';

  useEffect(() => {
    hardResetRef.current = hardResetQuizState;
    setIsQuizStartingRef.current = setIsQuizStarting;
  }, [hardResetQuizState, setIsQuizStarting]);

  useEffect(() => {
    const belt = localStorage.getItem('game-mode-belt');
    const storedOperation = localStorage.getItem('game-mode-operation');
    const storedTable = localStorage.getItem('game-mode-table');
    const storedTargetRoute = sessionStorage.getItem(GAME_MODE_EXIT_TARGET_KEY);
    const effectiveOperation = normalizeOperation(storedOperation || selectedOperation);
    const effectiveTable = Number(storedTable || selectedTable);
    const operationMaxLevel = Number(
      operationsMeta?.[effectiveOperation]?.maxLevel || getOperationMaxLevel(effectiveOperation, 19)
    );
    const isLastLevelInOperation =
      Number.isFinite(effectiveTable) &&
      Number.isFinite(operationMaxLevel) &&
      effectiveTable >= operationMaxLevel;
    const targetRoute =
      getExitRouteFromBelt(belt, { isLastLevelInOperation }) ||
      getExitRouteFromBelt(selectedDifficulty, { isLastLevelInOperation }) ||
      storedTargetRoute ||
      '/belts';

    resolvedRouteRef.current = targetRoute;
    sessionStorage.setItem(GAME_MODE_EXIT_TARGET_KEY, targetRoute);

    // Exit screen is terminal for the current run. Freeze timing immediately.
    setIsTimerPaused(true);
    setPausedTime(Date.now());
    setQuizStartTime(null);

    timeoutRef.current = setTimeout(() => {
      localStorage.removeItem('game-mode-belt');
      localStorage.removeItem('game-mode-table');
      localStorage.removeItem('game-mode-operation');
      sessionStorage.removeItem(GAME_MODE_EXIT_TARGET_KEY);

      if (hardResetRef.current) {
        hardResetRef.current();
      }

      if (setIsQuizStartingRef.current) {
        setIsQuizStartingRef.current(false);
      }

      navigate(resolvedRouteRef.current || '/belts', { replace: true });
    }, 3000); // 2 seconds to show the "MODE COMPLETE" screen

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    navigate,
    operationsMeta,
    selectedDifficulty,
    selectedOperation,
    selectedTable,
    setIsTimerPaused,
    setPausedTime,
    setQuizStartTime,
  ]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={
        isBonusMode
          ? {
              backgroundImage:
                "linear-gradient(180deg, rgba(5,16,48,0.42), rgba(4,14,38,0.72)), url('/night_sky_landscape.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }
          : undefined
      }
    >
      {isBonusMode ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(126,211,255,0.24),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(67,120,255,0.18),transparent_26%),radial-gradient(circle_at_50%_82%,rgba(34,211,238,0.14),transparent_30%)]" />
          <div className="relative w-full max-w-[820px] px-6">
            <div className="rounded-[34px] bg-[linear-gradient(145deg,rgba(116,211,255,0.42),rgba(44,108,255,0.24),rgba(8,18,58,0.74))] p-[1.5px] shadow-[0_24px_60px_rgba(4,12,20,0.6),0_0_30px_rgba(44,108,255,0.18)]">
              <div className="rounded-[32px] border border-[#bfe2ff]/15 bg-[radial-gradient(circle_at_top_left,_rgba(88,148,255,0.2),_rgba(16,36,101,0.94)_38%,_rgba(8,18,58,0.98)_100%)] px-8 py-12 text-center backdrop-blur-md sm:px-12">
                <div className="mx-auto mb-5 inline-flex items-center rounded-full border border-[#bfe2ff]/18 bg-white/10 px-5 py-2 text-sm font-black tracking-[0.35em] text-[#8fd7ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                  BELT UNLOCKED
                </div>
                <h1 className="text-5xl sm:text-7xl font-black tracking-[0.08em] text-white drop-shadow-[0_6px_18px_rgba(6,14,40,0.5)]">
                  {modeLabel}
                </h1>
                <h2 className="mt-4 text-4xl sm:text-6xl font-black tracking-[0.06em] text-[#8fd7ff] drop-shadow-[0_4px_14px_rgba(6,14,40,0.45)]">
                  GAME COMPLETED
                </h2>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center p-8 bg-white/90 rounded-3xl shadow-2xl border-4 border-orange-500 transform scale-110">
          <h1 className="text-6xl sm:text-7xl font-black text-orange-700 mb-4">{modeLabel}</h1>
          <h1 className="text-6xl sm:text-7xl font-black text-orange-700 mb-4">GAME COMPLETED</h1>
        </div>
      )}
    </div>
  );
};

export default GameModeExitScreen;
