import React, { useEffect, useMemo } from 'react';
import Confetti from 'react-confetti';
import { useLocation } from 'react-router-dom';
import { FaStar, FaTrophy } from 'react-icons/fa';
import {
  MODULE_SEQUENCE,
  getOperationLabel,
  getOperationMaxLevel,
  normalizeOperation,
} from '../config/modulesConfig.js';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const PretestResultScreen = () => {
  const {
    pretestResult,
    selectedOperation,
    selectedTable,
    operationsMeta,
    setPretestResult,
    setIsPretest,
    navigate,
  } = useMathGamePick((ctx) => ({
    pretestResult: ctx.pretestResult || null,
    selectedOperation: ctx.selectedOperation,
    selectedTable: ctx.selectedTable,
    operationsMeta: ctx.operationsMeta || {},
    setPretestResult: ctx.setPretestResult || (() => {}),
    setIsPretest: ctx.setIsPretest || (() => {}),
    navigate: ctx.navigate || (() => {}),
  }));
  const location = useLocation();

  const effectiveResult = useMemo(() => {
    const fromState = location?.state?.pretestResult;
    return pretestResult || fromState || null;
  }, [pretestResult, location]);

  useEffect(() => {
    if (!effectiveResult) {
      const fallbackTimer = setTimeout(() => {
        if (!pretestResult) navigate('/levels', { replace: true });
      }, 200);
      return () => clearTimeout(fallbackTimer);
    }

    const timer = setTimeout(() => {
      setPretestResult(null);
      setIsPretest(false);
      if (effectiveResult.passed === true) {
        const op = normalizeOperation(effectiveResult?.operation || selectedOperation);
        const levelFromResult = Number(effectiveResult?.level);
        const level = Number.isFinite(levelFromResult) ? levelFromResult : Number(selectedTable);
        const opMaxLevel = Number(
          operationsMeta?.[op]?.maxLevel || getOperationMaxLevel(op, 19)
        );
        const isLastLevelInOperation =
          Number.isFinite(level) && Number.isFinite(opMaxLevel) && level >= opMaxLevel;
        navigate(isLastLevelInOperation ? '/operations' : '/levels', { replace: true });
      } else {
        navigate('/belts', { replace: true, state: { level: selectedTable } });
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [
    effectiveResult,
    pretestResult,
    navigate,
    selectedOperation,
    selectedTable,
    operationsMeta,
    setPretestResult,
    setIsPretest,
  ]);

  if (!effectiveResult) return null;

  const { passed } = effectiveResult;
  const resultOperation = normalizeOperation(effectiveResult?.operation || selectedOperation);
  const levelFromResult = Number(effectiveResult?.level);
  const currentLevel = Number.isFinite(levelFromResult) ? levelFromResult : Number(selectedTable);
  const operationMaxLevel = Number(
    operationsMeta?.[resultOperation]?.maxLevel || getOperationMaxLevel(resultOperation, 19)
  );
  const isLastLevelInOperation =
    Number.isFinite(currentLevel) &&
    Number.isFinite(operationMaxLevel) &&
    currentLevel >= operationMaxLevel;
  const nextLevel = Number.isFinite(currentLevel) ? currentLevel + 1 : null;
  const nextOperation = (() => {
    const currentIndex = MODULE_SEQUENCE.indexOf(resultOperation);
    if (currentIndex === -1) return null;
    return MODULE_SEQUENCE[currentIndex + 1] || null;
  })();
  const transitionLabel = isLastLevelInOperation
    ? nextOperation
      ? `Taking you to ${getOperationLabel(nextOperation)}`
      : 'Taking you to the next module'
    : `Taking you to Level ${nextLevel ?? 'next'}`;

  return (
    <div
      className="min-h-screen full-height-safe relative w-full overflow-auto px-3 py-4 sm:px-5 sm:py-5"
      style={{
        backgroundImage: "url('/night_sky_landscape.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[#07143d]/45" />
      {passed && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={220}
          gravity={0.5}
          recycle={false}
          style={{ position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none' }}
        />
      )}

      <span className="pointer-events-none absolute left-[4%] top-[13%] h-3 w-3 rotate-12 rounded-sm bg-[#ff8f6b] opacity-90" />
      <span className="pointer-events-none absolute left-[13%] top-[30%] h-2.5 w-2.5 -rotate-6 rounded-sm bg-[#5eead4] opacity-90" />
      <span className="pointer-events-none absolute left-[8%] bottom-[16%] h-3 w-3 rotate-45 rounded-sm bg-[#c084fc] opacity-90" />
      <span className="pointer-events-none absolute right-[7%] top-[16%] h-3 w-3 -rotate-12 rounded-sm bg-[#60a5fa] opacity-90" />
      <span className="pointer-events-none absolute right-[14%] top-[42%] h-2.5 w-2.5 rotate-45 rounded-sm bg-[#f472b6] opacity-90" />
      <span className="pointer-events-none absolute right-[11%] bottom-[19%] h-3 w-3 -rotate-12 rounded-sm bg-[#fbbf24] opacity-90" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[72rem] items-center justify-center py-2">
        <div className="w-full max-w-[35rem] rounded-[2rem] bg-gradient-to-br from-cyan-300/70 via-teal-300/56 to-sky-300/62 p-[1.5px] shadow-[0_18px_48px_rgba(4,12,20,0.6)] sm:rounded-[2.25rem]">
          <div className="relative overflow-hidden rounded-[calc(2rem-1.5px)] border border-white/15 bg-slate-900/62 px-3 pb-4 pt-14 text-center backdrop-blur-md sm:rounded-[calc(2.25rem-1.5px)] sm:px-5 sm:pb-6 sm:pt-[4.75rem]">
            <div className="pointer-events-none absolute -top-14 -right-12 h-28 w-28 rounded-full bg-cyan-300/18 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-32 w-32 rounded-full bg-sky-300/12 blur-2xl" />
            <div className="pointer-events-none absolute inset-0">
              <div
                className={`absolute inset-x-0 top-0 h-32 ${
                  passed
                    ? 'bg-[radial-gradient(circle_at_top,_rgba(255,224,130,0.22),_transparent_68%)]'
                    : 'bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.2),_transparent_68%)]'
                }`}
              />
              <div className="absolute left-5 top-6 h-2 w-2 rotate-12 rounded-sm bg-[#ff9258]" />
              <div className="absolute left-10 top-16 h-3 w-3 rotate-45 rounded-sm bg-[#ffd95f]" />
              <div className="absolute left-[18%] top-10 h-3 w-3 -rotate-12 rounded-sm bg-[#4be4d4]" />
              <div className="absolute right-8 top-7 h-2.5 w-2.5 rotate-45 rounded-sm bg-[#ff7ab6]" />
              <div className="absolute right-14 top-14 h-3 w-3 -rotate-12 rounded-sm bg-[#ffd95f]" />
              <div className="absolute right-[21%] top-11 h-2.5 w-2.5 rotate-12 rounded-sm bg-[#76b7ff]" />
              <div className="absolute left-6 bottom-10 h-3 w-3 rounded-full bg-white/80 blur-[1px]" />
              <div className="absolute right-7 bottom-12 h-3 w-3 rounded-full bg-white/80 blur-[1px]" />
            </div>

            {passed && (
              <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2">
                <div className="flex h-[3.7rem] w-[3.7rem] items-center justify-center rounded-full bg-gradient-to-b from-[#ffd969] via-[#ffbf2f] to-[#f08a00] text-[1.7rem] text-yellow-50 shadow-[0_0_24px_rgba(255,209,74,0.7),0_14px_26px_rgba(249,115,22,0.42)] sm:h-[4.8rem] sm:w-[4.8rem] sm:text-[2.3rem]">
                  <FaTrophy />
                </div>
              </div>
            )}

            <div className={`relative mx-auto w-full max-w-[31rem] px-1 ${passed ? 'mb-3.5 sm:mb-5' : 'mb-7 sm:mb-9'}`}>
              <div
                className={`pointer-events-none absolute -left-2 top-1/2 hidden h-7 w-9 -translate-y-1/2 skew-y-[-10deg] rounded-l-md shadow-md min-[440px]:block sm:-left-3 sm:h-10 sm:w-14 ${
                  passed
                    ? 'bg-gradient-to-b from-[#ffcb39] to-[#df7f00]'
                    : 'bg-gradient-to-b from-[#38bdf8] to-[#0284c7]'
                }`}
              />
              <div
                className={`pointer-events-none absolute -right-2 top-1/2 hidden h-7 w-9 -translate-y-1/2 skew-y-[10deg] rounded-r-md shadow-md min-[440px]:block sm:-right-3 sm:h-10 sm:w-14 ${
                  passed
                    ? 'bg-gradient-to-b from-[#ffcb39] to-[#df7f00]'
                    : 'bg-gradient-to-b from-[#38bdf8] to-[#0284c7]'
                }`}
              />
              <div
                className={`relative rounded-[1rem] px-3 py-2.5 text-center sm:rounded-[1.3rem] sm:px-5 sm:py-3.5 ${
                  passed
                    ? 'border border-[#ffdf84] bg-gradient-to-b from-[#ffd764] via-[#ffbf19] to-[#ef9200] shadow-[inset_0_2px_0_rgba(255,245,190,0.9),0_10px_22px_rgba(115,59,0,0.28)]'
                    : 'border border-[#7dd3fc] bg-gradient-to-r from-[#38bdf8] via-[#0ea5e9] to-[#0284c7] shadow-[inset_0_2px_0_rgba(186,230,253,0.6),0_10px_22px_rgba(2,132,199,0.3)]'
                }`}
              >
                <h2
                  className={`m-0 font-black uppercase text-white ${
                    passed
                      ? 'text-[clamp(0.95rem,4.8vw,2.85rem)] tracking-tight'
                      : 'text-[clamp(0.95rem,4.8vw,2.6rem)] tracking-[0.12em]'
                  }`}
                  style={{
                    textShadow: passed
                      ? '0 3px 0 rgba(131,67,8,0.42), 0 7px 14px rgba(120,61,6,0.22)'
                      : '0 3px 0 rgba(4, 51, 75, 0.5), 0 7px 14px rgba(3, 37, 54, 0.25)',
                  }}
                >
                  {passed ? 'Congratulations' : 'Way To Go'}
                </h2>
              </div>
            </div>

            {passed ? (
              <div className="relative mx-auto mb-3.5 w-full max-w-[21.5rem] rounded-[1rem] border border-[#79f1aa] bg-gradient-to-b from-[#ebfff2] to-[#c5f6d5] px-3 py-2 text-center shadow-[inset_0_2px_0_rgba(255,255,255,0.95),0_0_0_2px_rgba(62,219,128,0.16),0_10px_22px_rgba(16,185,129,0.2)] sm:mb-5 sm:max-w-[24rem] sm:px-4 sm:py-3">
                <span className="pointer-events-none absolute left-1/2 top-0 inline-flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#f6d24f] bg-gradient-to-b from-[#ffd964] to-[#f4b100] text-emerald-600 shadow-[0_6px_14px_rgba(245,158,11,0.35)] sm:h-9 sm:w-9">
                  <FaStar className="text-sm" />
                </span>
                <p className="m-0 text-[clamp(0.88rem,3.5vw,1.85rem)] font-black leading-tight text-emerald-700">
                  <span className="text-orange-500">{transitionLabel}</span>
                </p>
              </div>
            ) : null}

            {passed ? (
              null
            ) : (
              <div className="mx-auto mb-3.5 flex w-full max-w-[30rem] items-center justify-center rounded-[1rem] border border-[#f4dc98] bg-gradient-to-b from-[#fff6db] to-[#f7ebc5] px-3 py-2 text-center shadow-[inset_0_2px_0_rgba(255,255,255,0.9),0_8px_18px_rgba(30,41,59,0.12)] sm:mb-5 sm:px-4 sm:py-3">
                <p className="m-0 font-extrabold text-[clamp(0.78rem,2.7vw,1.45rem)] text-[#34406a]">
                  EARN YOUR <span className="text-orange-500">BELTS</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PretestResultScreen;
