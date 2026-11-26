import AdminBrand from './admin/AdminBrand.jsx';
import '../styles/ClassroomTransitions.css';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getOperationMaxLevel,
  normalizeOperation,
} from '../config/modulesConfig.js';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';
import { getWordProblemNextRoute } from '../utils/wordProblemProgress.js';

const GAME_MODE_EXIT_TARGET_KEY = 'game-mode-exit-target';
const WORD_PROBLEM_EXIT_TARGET = '/word-problems-complete';

const getExitRouteFromBelt = (belt, { isLastLevelInOperation = false, operation } = {}) => {
  if (!belt) return null;

  const lowerBelt = String(belt).toLowerCase();
  if (operation === 'add' && lowerBelt === 'black-7') return '/word-problems';
  if (operation === 'add' && lowerBelt === 'word-problems') return WORD_PROBLEM_EXIT_TARGET;
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
    childPin,
    refreshOperationAndProgress,
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
    childPin: ctx.childPin,
    refreshOperationAndProgress: ctx.refreshOperationAndProgress,
    setIsTimerPaused: ctx.setIsTimerPaused || (() => {}),
    setPausedTime: ctx.setPausedTime || (() => {}),
    setQuizStartTime: ctx.setQuizStartTime || (() => {}),
  }));
  const [nextActivityError, setNextActivityError] = useState(false);
  const [retry, setRetry] = useState(0);
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

  const effectiveOperation = normalizeOperation(localStorage.getItem('game-mode-operation') || selectedOperation);
  const operationMaxLevel = Number(
    operationsMeta?.[effectiveOperation]?.maxLevel || getOperationMaxLevel(effectiveOperation, 19)
  );

  useEffect(() => {
    let cancelled = false;
    const belt = localStorage.getItem('game-mode-belt');
    const storedTable = localStorage.getItem('game-mode-table');
    const storedTargetRoute = sessionStorage.getItem(GAME_MODE_EXIT_TARGET_KEY);
    const effectiveTable = Number(storedTable || selectedTable);
    const isLastLevelInOperation =
      Number.isFinite(effectiveTable) &&
      Number.isFinite(operationMaxLevel) &&
      effectiveTable >= operationMaxLevel;
    const targetRoute =
      getExitRouteFromBelt(belt, { isLastLevelInOperation, operation: effectiveOperation }) ||
      getExitRouteFromBelt(selectedDifficulty, { isLastLevelInOperation, operation: effectiveOperation }) ||
      storedTargetRoute ||
      '/belts';

    sessionStorage.setItem(GAME_MODE_EXIT_TARGET_KEY, targetRoute);

    // Exit screen is terminal for the current run. Freeze timing immediately.
    setIsTimerPaused(true);
    setPausedTime(Date.now());
    setQuizStartTime(null);

    timeoutRef.current = setTimeout(async () => {
      let destination = targetRoute;
      if (targetRoute === WORD_PROBLEM_EXIT_TARGET) {
        try {
          destination = await getWordProblemNextRoute(childPin, refreshOperationAndProgress);
        } catch {
          if (!cancelled) setNextActivityError(true);
          return;
        }
        if (cancelled) return;
      }

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

      navigate(destination, { replace: true });
    }, retry ? 0 : 3000);

    return () => {
      cancelled = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [
    navigate,
    childPin,
    effectiveOperation,
    operationMaxLevel,
    refreshOperationAndProgress,
    retry,
    selectedDifficulty,
    selectedTable,
    setIsTimerPaused,
    setPausedTime,
    setQuizStartTime,
  ]);

  return (
    <div
      className="classroom-selection-page classroom-game-summary fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
    >
      <AdminBrand className="classroom-screen-brand" />
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
        <div className="relative mx-4 w-[calc(100%-2rem)] max-w-3xl text-center p-5 sm:p-8 bg-white/90 rounded-3xl shadow-2xl border-4 border-orange-500">
          <h1 className="text-[clamp(1.6rem,6vw,4.5rem)] break-words font-black text-orange-700 mb-4">{modeLabel}</h1>
          <h1 className="text-[clamp(1.6rem,6vw,4.5rem)] break-words font-black text-orange-700 mb-4">GAME COMPLETED</h1>
        </div>
      )}
      {nextActivityError && (
        <div className="relative mx-4 mt-4 rounded-xl bg-white px-4 py-3 text-center text-slate-900">
          <p role="alert">Could not load your next activity.</p>
          <button type="button" className="mt-2 rounded-lg bg-blue-700 px-4 py-2 font-bold text-white" onClick={() => {
            setNextActivityError(false);
            setRetry(attempt => attempt + 1);
          }}>Retry</button>
        </div>
      )}
    </div>
  );
};

export default GameModeExitScreen;
