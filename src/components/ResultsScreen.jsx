import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Confetti from 'react-confetti';
import { FaArrowRight, FaBullseye, FaClock, FaStar, FaTrophy } from 'react-icons/fa';
import { showShootingStars, clearShootingStars } from '../utils/mathGameLogic';
import { useNavigate } from 'react-router-dom';
import { quizComplete } from '../api/mathApi.js';
import { getOperationMaxLevel, normalizeOperation } from '../config/modulesConfig.js';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const calculateFinalRoute = (selectedDifficulty, isBlack, degree, isLastLevelInOperation) => {
  if (selectedDifficulty === 'brown') {
    return '/black';
  }

  if (isBlack) {
    if (degree === 7) {
      return isLastLevelInOperation ? '/operations' : '/levels';
    }
    return '/black';
  }

  return '/belts';
};

const resolveIsLastLevelInOperation = (selectedOperation, selectedTable, operationsMeta) => {
  const op = normalizeOperation(selectedOperation);
  const operationMaxLevel = Number(operationsMeta?.[op]?.maxLevel || getOperationMaxLevel(op, 19));
  const currentLevelNumber = Number(selectedTable);
  return (
    Number.isFinite(currentLevelNumber) &&
    Number.isFinite(operationMaxLevel) &&
    currentLevelNumber >= operationMaxLevel
  );
};

const StatCard = ({ icon: Icon, iconWrapClass, label, value, valueClass }) => (
  <div className="rounded-[1.05rem] border border-blue-200/80 bg-gradient-to-b from-white via-[#f9fbff] to-[#eef5ff] p-2.5 shadow-[0_10px_22px_rgba(15,23,42,0.14)] sm:rounded-[1.45rem] sm:p-4">
    <div className="mb-2 flex items-center gap-2 sm:mb-2.5 sm:gap-2.5">
      <span
        className={[
          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm shadow-[inset_0_2px_0_rgba(255,255,255,0.9),0_5px_12px_rgba(59,130,246,0.18)] sm:h-11 sm:w-11 sm:text-lg',
          iconWrapClass,
        ].join(' ')}
        aria-hidden="true"
      >
        <Icon />
      </span>
      <span className="text-left font-black text-[#33406f] text-[clamp(0.76rem,1.9vw,1.35rem)]">
        {label}
      </span>
    </div>
    <div
      className={[
        'text-center font-black leading-none tracking-tight text-[clamp(1.5rem,5vw,3.2rem)]',
        valueClass,
      ].join(' ')}
    >
      {value}
    </div>
  </div>
);

const ResultsScreen = () => {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const [timeSecs] = useState(() => {
    const ls = Number(localStorage.getItem('math-last-quiz-duration') || 0);
    return Number.isFinite(ls) ? ls : 0;
  });
  const completionSentRef = useRef(false);
  const starsShownRef = useRef(false);
  const fitFrameRef = useRef(null);
  const fitCardRef = useRef(null);
  const [cardScale, setCardScale] = useState(1);

  const {
    selectedDifficulty,
    sessionCorrectCount,
    correctCount,
    grandTotalCorrect,
    quizRunId,
    childPin,
    setQuizRunId,
    setTempNextRoute,
    selectedOperation,
    selectedTable,
    operationsMeta,
  } = useMathGamePick((ctx) => ({
    selectedDifficulty: ctx.selectedDifficulty,
    sessionCorrectCount: Number.isFinite(ctx.sessionCorrectCount) ? ctx.sessionCorrectCount : 0,
    correctCount: Number.isFinite(ctx.correctCount) ? ctx.correctCount : 0,
    grandTotalCorrect: Number.isFinite(ctx.grandTotalCorrect) ? ctx.grandTotalCorrect : 0,
    quizRunId: ctx.quizRunId,
    childPin: ctx.childPin,
    setQuizRunId: ctx.setQuizRunId || (() => {}),
    setTempNextRoute: ctx.setTempNextRoute || (() => {}),
    selectedOperation: ctx.selectedOperation,
    selectedTable: ctx.selectedTable,
    operationsMeta: ctx.operationsMeta || {},
  }));

  const isBlack = String(selectedDifficulty).startsWith('black');
  const degree = isBlack ? parseInt(String(selectedDifficulty).split('-')[1] || '1', 10) : null;
  const maxQuestions = isBlack ? 20 : 10;
  const allCorrect = sessionCorrectCount === maxQuestions;
  const isLastLevelInOperation = resolveIsLastLevelInOperation(
    selectedOperation,
    selectedTable,
    operationsMeta
  );

  useEffect(() => {
    if (!allCorrect) {
      navigate('/game-mode-intro', { replace: true });
    }
  }, [allCorrect, navigate]);

  useEffect(() => {
    if (allCorrect && !leaving) {
      const finalRoute = calculateFinalRoute(
        selectedDifficulty,
        isBlack,
        degree,
        isLastLevelInOperation
      );

      if (!completionSentRef.current && quizRunId) {
        completionSentRef.current = true;
        quizComplete(quizRunId, childPin).catch(console.error);
      }

      if (!starsShownRef.current) {
        starsShownRef.current = true;
        showShootingStars();
      }

      const autoNavDelay = setTimeout(() => {
        localStorage.removeItem('math-last-quiz-duration');
        setQuizRunId(null);
        setTempNextRoute(finalRoute);
        navigate('/video', { replace: true });
      }, 5000);

      return () => {
        clearTimeout(autoNavDelay);
        clearShootingStars();
      };
    }
  }, [
    allCorrect,
    leaving,
    isBlack,
    degree,
    selectedDifficulty,
    isLastLevelInOperation,
    quizRunId,
    childPin,
    setQuizRunId,
    setTempNextRoute,
    navigate,
  ]);

  useLayoutEffect(() => {
    const frameEl = fitFrameRef.current;
    const cardEl = fitCardRef.current;
    if (!frameEl || !cardEl) return;

    let rafId = 0;
    const recalcScale = () => {
      const availableHeight = frameEl.clientHeight;
      const naturalHeight = cardEl.scrollHeight;
      if (!availableHeight || !naturalHeight) return;
      const nextScale = Math.min(1, availableHeight / naturalHeight);
      const clampedScale = Math.max(0.58, Number(nextScale.toFixed(3)));
      setCardScale((prev) => (Math.abs(prev - clampedScale) > 0.01 ? clampedScale : prev));
    };

    const scheduleRecalc = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(recalcScale);
    };

    scheduleRecalc();
    window.addEventListener('resize', scheduleRecalc);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleRecalc) : null;
    resizeObserver?.observe(frameEl);
    resizeObserver?.observe(cardEl);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleRecalc);
      resizeObserver?.disconnect();
    };
  }, [allCorrect, leaving, selectedDifficulty, sessionCorrectCount, correctCount, grandTotalCorrect]);

  const handlePrimary = () => {
    const nextRoute = calculateFinalRoute(selectedDifficulty, isBlack, degree, isLastLevelInOperation);

    if (allCorrect && !leaving) {
      setLeaving(true);
      clearShootingStars();
      localStorage.removeItem('math-last-quiz-duration');
      setQuizRunId(null);

      if (!completionSentRef.current && quizRunId) {
        completionSentRef.current = true;
        quizComplete(quizRunId, childPin).catch(console.error);
      }

      setTempNextRoute(nextRoute);
      navigate('/video', { replace: true });
    }
  };

  if (!allCorrect || leaving) {
    return null;
  }

  const sessionTimeSecs = Math.round(timeSecs);
  const timeLabel = `${sessionTimeSecs}s`;
  const beltName = (() => {
    if (isBlack) return `Black (Degree ${degree})`;
    switch (selectedDifficulty) {
      case 'white':
        return 'White';
      case 'yellow':
        return 'Yellow';
      case 'green':
        return 'Green';
      case 'blue':
        return 'Blue';
      case 'red':
        return 'Red';
      case 'brown':
        return 'Brown';
      default:
        return 'Unknown';
    }
  })();
  const pointsEarned = maxQuestions;

  const decorationRects = [
    'left-[4%] top-[11%] h-3 w-3 rotate-12 bg-[#ff8f6b]',
    'left-[13%] top-[33%] h-2.5 w-2.5 -rotate-6 bg-[#5eead4]',
    'left-[8%] bottom-[14%] h-3 w-3 rotate-45 bg-[#c084fc]',
    'right-[7%] top-[15%] h-3 w-3 -rotate-12 bg-[#60a5fa]',
    'right-[14%] top-[40%] h-2.5 w-2.5 rotate-45 bg-[#f472b6]',
    'right-[11%] bottom-[20%] h-3 w-3 -rotate-12 bg-[#fbbf24]',
  ];

  return (
    <div
      className="min-h-screen full-height-safe w-full relative overflow-hidden px-3 py-3 sm:px-5 sm:py-4 md:px-7"
      style={{
        backgroundImage: "url('/night_sky_landscape.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[#07143d]/45" />
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        numberOfPieces={allCorrect ? 280 : 160}
        gravity={0.5}
        recycle={false}
        style={{ position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none' }}
      />

      {decorationRects.map((className, idx) => (
        <span key={idx} className={`pointer-events-none absolute rounded-sm opacity-90 ${className}`} />
      ))}

      <div
        ref={fitFrameRef}
        className="relative z-10 mx-auto flex h-[calc(100vh-0.75rem)] w-full max-w-[72rem] items-center justify-center py-1 sm:h-[calc(100vh-1rem)]"
      >
        <div className="flex w-full justify-center">
          <div
            ref={fitCardRef}
            className="relative mx-auto w-full max-w-[35rem] rounded-[2rem] bg-gradient-to-br from-cyan-300/70 via-teal-300/56 to-sky-300/62 p-[1.5px] shadow-[0_18px_48px_rgba(4,12,20,0.6)] sm:rounded-[2.25rem]"
            style={{ transform: `scale(${cardScale})`, transformOrigin: 'center center' }}
          >
          <div className="relative overflow-hidden rounded-[calc(2rem-1.5px)] border border-white/15 bg-slate-900/62 px-3 pb-4 pt-14 backdrop-blur-md sm:rounded-[calc(2.25rem-1.5px)] sm:px-5 sm:pb-6 sm:pt-[4.75rem]">
          <div className="pointer-events-none absolute -top-14 -right-12 h-28 w-28 rounded-full bg-cyan-300/18 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 h-32 w-32 rounded-full bg-sky-300/12 blur-2xl" />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(255,224,130,0.22),_transparent_68%)]" />
            <div className="absolute left-5 top-6 h-2 w-2 rotate-12 rounded-sm bg-[#ff9258]" />
            <div className="absolute left-10 top-16 h-3 w-3 rotate-45 rounded-sm bg-[#ffd95f]" />
            <div className="absolute left-[18%] top-10 h-3 w-3 -rotate-12 rounded-sm bg-[#4be4d4]" />
            <div className="absolute right-8 top-7 h-2.5 w-2.5 rotate-45 rounded-sm bg-[#ff7ab6]" />
            <div className="absolute right-14 top-14 h-3 w-3 -rotate-12 rounded-sm bg-[#ffd95f]" />
            <div className="absolute right-[21%] top-11 h-2.5 w-2.5 rotate-12 rounded-sm bg-[#76b7ff]" />
            <div className="absolute left-6 bottom-10 h-3 w-3 rounded-full bg-white/80 blur-[1px]" />
            <div className="absolute right-7 bottom-12 h-3 w-3 rounded-full bg-white/80 blur-[1px]" />
          </div>

          <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2">
            <div className="flex h-[3.7rem] w-[3.7rem] items-center justify-center rounded-full bg-gradient-to-b from-[#ffd969] via-[#ffbf2f] to-[#f08a00] text-[1.7rem] text-yellow-50 shadow-[0_0_24px_rgba(255,209,74,0.7),0_14px_26px_rgba(249,115,22,0.42)] sm:h-[4.8rem] sm:w-[4.8rem] sm:text-[2.3rem]">
              <FaTrophy />
            </div>
          </div>

          <div className="relative mx-auto mb-3.5 w-full max-w-[31rem] px-1 sm:mb-5">
            <div className="pointer-events-none absolute -left-2 top-1/2 hidden h-7 w-9 -translate-y-1/2 skew-y-[-10deg] rounded-l-md bg-gradient-to-b from-[#ffcb39] to-[#df7f00] shadow-md min-[440px]:block sm:-left-3 sm:h-10 sm:w-14" />
            <div className="pointer-events-none absolute -right-2 top-1/2 hidden h-7 w-9 -translate-y-1/2 skew-y-[10deg] rounded-r-md bg-gradient-to-b from-[#ffcb39] to-[#df7f00] shadow-md min-[440px]:block sm:-right-3 sm:h-10 sm:w-14" />
            <div className="relative rounded-[1rem] border border-[#ffdf84] bg-gradient-to-b from-[#ffd764] via-[#ffbf19] to-[#ef9200] px-3 py-2.5 text-center shadow-[inset_0_2px_0_rgba(255,245,190,0.9),0_10px_22px_rgba(115,59,0,0.28)] sm:rounded-[1.3rem] sm:px-5 sm:py-3.5">
              <h2
                className="m-0 text-[clamp(0.95rem,4.8vw,2.85rem)] font-black uppercase tracking-tight text-white"
                style={{ textShadow: '0 3px 0 rgba(131,67,8,0.42), 0 7px 14px rgba(120,61,6,0.22)' }}
              >
                Congratulations
              </h2>
            </div>
          </div>

          <div className="relative mx-auto mb-3.5 w-full max-w-[21.5rem] rounded-[1rem] border border-[#79f1aa] bg-gradient-to-b from-[#ebfff2] to-[#c5f6d5] px-3 py-2 text-center shadow-[inset_0_2px_0_rgba(255,255,255,0.95),0_0_0_2px_rgba(62,219,128,0.16),0_10px_22px_rgba(16,185,129,0.2)] sm:mb-5 sm:max-w-[24rem] sm:px-4 sm:py-3">
            <span className="pointer-events-none absolute left-1/2 top-0 inline-flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#f6d24f] bg-gradient-to-b from-[#ffd964] to-[#f4b100] text-emerald-600 shadow-[0_6px_14px_rgba(245,158,11,0.35)] sm:h-9 sm:w-9">
              <FaStar className="text-sm" />
            </span>
            <p className="m-0 text-[clamp(0.88rem,3.5vw,1.85rem)] font-black leading-tight text-emerald-700">
              You earned <span className="text-orange-500">{pointsEarned} points</span>
            </p>
          </div>

          <div className="mb-3.5 grid grid-cols-2 gap-2 sm:mb-5 sm:gap-3">
            <StatCard
              icon={FaBullseye}
              iconWrapClass="border border-purple-200 bg-gradient-to-b from-[#f1e8ff] to-[#e5d5ff] text-purple-600"
              label="Session Score"
              value={sessionCorrectCount}
              valueClass="text-purple-500"
            />
            <StatCard
              icon={FaClock}
              iconWrapClass="border border-sky-200 bg-gradient-to-b from-[#e0f2fe] to-[#c7e8ff] text-sky-600"
              label="Time Taken"
              value={timeLabel}
              valueClass="text-sky-500"
            />
            <StatCard
              icon={FaStar}
              iconWrapClass="border border-amber-200 bg-gradient-to-b from-[#fff2cf] to-[#ffe4a3] text-amber-500"
              label="Today's Score"
              value={correctCount}
              valueClass="text-orange-500"
            />
            <StatCard
              icon={FaTrophy}
              iconWrapClass="border border-lime-200 bg-gradient-to-b from-[#ebffd9] to-[#d7f8b8] text-lime-600"
              label="Total Score"
              value={grandTotalCorrect}
              valueClass="text-lime-600"
            />
          </div>

          <div className="mx-auto mb-3.5 flex w-full max-w-[30rem] items-center justify-center gap-2 rounded-[1rem] border border-[#f4dc98] bg-gradient-to-b from-[#fff6db] to-[#f7ebc5] px-2.5 py-2 text-center shadow-[inset_0_2px_0_rgba(255,255,255,0.9),0_8px_18px_rgba(30,41,59,0.12)] sm:mb-5 sm:gap-3 sm:px-4 sm:py-3">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#ffd36e] bg-gradient-to-b from-[#ffd964] to-[#f1a900] text-amber-50 shadow-[0_7px_16px_rgba(245,158,11,0.35)] sm:h-10 sm:w-10"
              aria-hidden="true"
            >
              <FaStar />
            </span>
            <p className="m-0 font-extrabold text-[clamp(0.78rem,2.7vw,1.45rem)] text-[#34406a]">
              You earned the <span className="text-orange-500">{beltName} Belt</span>
            </p>
          </div>

          <div className="flex justify-center">
            <button
              className="m-0 inline-flex w-full max-w-[16.75rem] items-center justify-center gap-2 rounded-full border border-[#5bd46e] bg-gradient-to-b from-[#49de68] via-[#28c652] to-[#15953c] px-3.5 py-2.5 text-[clamp(0.88rem,2.8vw,1.45rem)] font-black text-white shadow-[inset_0_2px_0_rgba(215,255,220,0.8),0_12px_24px_rgba(22,163,74,0.35)] transition hover:opacity-95 sm:max-w-[20rem] sm:gap-2.5 sm:px-4 sm:text-[clamp(1rem,3vw,1.45rem)]"
              onClick={handlePrimary}
              type="button"
            >
              Continue to Video
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-emerald-600 shadow-inner sm:h-8 sm:w-8">
                <FaArrowRight className="text-sm sm:text-base" />
              </span>
            </button>
          </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;
