import React, { useRef, useEffect, useState } from 'react';
import { FaCog } from "react-icons/fa";
import SettingsModal from "./SettingsModal.jsx";
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const GameModeScreen = () => {
  const {
    currentQuestion,
    handleAnswer,
    isAnimating,
    isTimerPaused,
    gameModeType,
    surfCorrectStreak,
    completedSurfQuizzes,
    surfQuizzesRequired,
    questionsPerQuiz,
    rocketCorrectStreak,
    completedRocketQuizzes,
    rocketQuizzesRequired,
    rocketQuestionsPerQuiz,
    bonusCorrectStreak,
    bonusVideoIntervalCorrect,
    lightningCount,
    lightningCycleStart,
    questionStartTimestamp,
    showSettings,
    setShowSettings,
    handleQuit,
    handleResetProgress,
  } = useMathGamePick((ctx) => ({
    currentQuestion: ctx.currentQuestion || null,
    handleAnswer: ctx.handleAnswer || (() => {}),
    isAnimating: Boolean(ctx.isAnimating),
    isTimerPaused: Boolean(ctx.isTimerPaused),
    gameModeType: ctx.gameModeType,
    surfCorrectStreak: Number.isFinite(ctx.surfCorrectStreak) ? ctx.surfCorrectStreak : 0,
    completedSurfQuizzes: Number.isFinite(ctx.completedSurfQuizzes) ? ctx.completedSurfQuizzes : 0,
    surfQuizzesRequired: Number.isFinite(ctx.surfQuizzesRequired) ? ctx.surfQuizzesRequired : 0,
    questionsPerQuiz: Number.isFinite(ctx.questionsPerQuiz) ? ctx.questionsPerQuiz : 0,
    rocketCorrectStreak: Number.isFinite(ctx.rocketCorrectStreak) ? ctx.rocketCorrectStreak : 0,
    completedRocketQuizzes: Number.isFinite(ctx.completedRocketQuizzes) ? ctx.completedRocketQuizzes : 0,
    rocketQuizzesRequired: Number.isFinite(ctx.rocketQuizzesRequired) ? ctx.rocketQuizzesRequired : 0,
    rocketQuestionsPerQuiz: Number.isFinite(ctx.rocketQuestionsPerQuiz) ? ctx.rocketQuestionsPerQuiz : 0,
    bonusCorrectStreak: Number.isFinite(ctx.bonusCorrectStreak) ? ctx.bonusCorrectStreak : 0,
    bonusVideoIntervalCorrect: Number.isFinite(ctx.bonusVideoIntervalCorrect)
      ? ctx.bonusVideoIntervalCorrect
      : 4,
    lightningCount: Number.isFinite(ctx.lightningCount) ? ctx.lightningCount : 0,
    lightningCycleStart: Number.isFinite(ctx.lightningCycleStart) ? ctx.lightningCycleStart : 0,
    questionStartTimestamp: ctx.questionStartTimestamp || { current: null },
    showSettings: Boolean(ctx.showSettings),
    setShowSettings: ctx.setShowSettings || (() => {}),
    handleQuit: ctx.handleQuit || (() => {}),
    handleResetProgress: ctx.handleResetProgress || (() => {}),
  }));

  const isSurfMode = gameModeType === 'surf';
  const isRocketMode = gameModeType === 'rocket';
  const isBonusMode = gameModeType === 'bonus';
  const isLightningMode = gameModeType === 'lightning' && !isSurfMode;
  const useNightSkyTheme =
    isSurfMode || isRocketMode || isBonusMode || isLightningMode;

  const answerRefs = useRef([]);
  const lastClickRef = useRef({ qid: null, t: 0 });
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [typedInput, setTypedInput] = useState('');

  useEffect(() => {
    if (currentQuestion) {
      answerRefs.current = Array.isArray(currentQuestion.answers)
        ? currentQuestion.answers.map((_, i) => answerRefs.current[i] || React.createRef())
        : [];
      setIsAnswerSubmitted(false);
      lastClickRef.current = { qid: currentQuestion.id, t: 0 };
      setTypedInput('');

      if (questionStartTimestamp?.current) {
        questionStartTimestamp.current = Date.now();
      }
    }
  }, [currentQuestion, questionStartTimestamp]);

  const handleAnswerClick = (answer) => {
    if (isAnswerSubmitted || isAnimating || isTimerPaused || !currentQuestion) return;

    const now = Date.now();
    if (lastClickRef.current.qid === currentQuestion.id && now - lastClickRef.current.t < 700) {
      return;
    }

    lastClickRef.current = { qid: currentQuestion.id, t: now };

    setIsAnswerSubmitted(true);
    Promise.resolve(handleAnswer(answer)).finally(() => {
      setTimeout(() => {
        if (currentQuestion && lastClickRef.current.qid === currentQuestion.id) {
          setIsAnswerSubmitted(false);
        }
      }, 200);
    });
  };

  const handleDigitPress = (digit) => {
    if (isAnswerSubmitted || isAnimating || isTimerPaused || !currentQuestion) return;
    setTypedInput((prev) => {
      const raw = String(digit);
      if (prev.length >= 4) return prev;
      return `${prev}${raw}`;
    });
  };

  const handleClear = () => {
    if (isAnswerSubmitted || isAnimating || isTimerPaused || !currentQuestion) return;
    setTypedInput('');
  };

  const handleSubmitTyped = () => {
    if (!typedInput || isAnswerSubmitted || isAnimating || isTimerPaused || !currentQuestion) {
      return;
    }
    const numericAnswer = Number(typedInput);
    if (!Number.isFinite(numericAnswer)) return;

    setIsAnswerSubmitted(true);
    Promise.resolve(handleAnswer(numericAnswer)).finally(() => {
      setTimeout(() => setIsAnswerSubmitted(false), 200);
    });
  };

  const surfEmojiCount = Math.max(
    0,
    Math.min(
      Number.isFinite(surfCorrectStreak) ? surfCorrectStreak : 0,
      Number.isFinite(questionsPerQuiz) ? questionsPerQuiz : 10
    )
  );

  const lightningSymbol = '\u26A1';
  const lightningCycleCount = Math.max(0, lightningCount - lightningCycleStart);
  const lightningCycleRemainder = lightningCycleCount % 5;
  const lightningDisplayCount =
    lightningCycleCount === 0 ? 0 : lightningCycleRemainder === 0 ? 5 : lightningCycleRemainder;
  const lightningDisplay = lightningSymbol.repeat(lightningDisplayCount);

  const rocketEmojiCount = Math.max(
    0,
    Math.min(
      Number.isFinite(rocketCorrectStreak) ? rocketCorrectStreak : 0,
      Number.isFinite(rocketQuestionsPerQuiz) ? rocketQuestionsPerQuiz : 10
    )
  );
  const bonusStarCount = Math.max(
    0,
    Math.min(
      Number.isFinite(bonusCorrectStreak) ? bonusCorrectStreak : 0,
      Number.isFinite(bonusVideoIntervalCorrect) && bonusVideoIntervalCorrect > 0
        ? bonusVideoIntervalCorrect
        : 4
    )
  );

  const shellClassName =
    'relative overflow-hidden rounded-[32px] border border-[#bfe2ff]/18 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.96),_rgba(231,243,255,0.94)_40%,_rgba(215,233,255,0.92)_100%)] shadow-[0_26px_56px_rgba(4,12,20,0.34),inset_0_1px_0_rgba(255,255,255,0.9)] w-full mx-auto p-4 sm:p-6 md:p-7 min-h-[220px] sm:min-h-[320px] md:min-h-[410px] flex flex-col justify-center';
  const surfShellClassName =
    'relative overflow-hidden bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 rounded-2xl sm:rounded-3xl shadow-2xl border border-blue-200/30 w-full mx-auto p-6 sm:p-8 min-h-[200px] sm:min-h-[300px] md:min-h-[400px] flex flex-col justify-center';
  const answerCardClassName =
    'w-full rounded-[22px] border border-[#c9def7] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(226,237,250,0.92))] shadow-[0_12px_22px_rgba(31,67,117,0.14),inset_0_1px_0_rgba(255,255,255,0.88)]';
  const surfKeypadButtonClassName =
    'bg-gray-100 text-gray-800 font-bold text-2xl py-2 rounded-xl shadow-md hover:bg-gray-200 active:scale-95 transition select-none border border-gray-200';

  return (
    <div
      className="App min-h-screen w-full relative landscape-optimized portrait-optimized ios-notch"
      style={{
        background: useNightSkyTheme
          ? undefined
          : 'linear-gradient(135deg, #1A237E 0%, #303F9F 60%, #3F51B5 100%)',
        backgroundImage: useNightSkyTheme
          ? "linear-gradient(180deg, rgba(5,16,48,0.38), rgba(4,14,38,0.7)), url('/night_sky_landscape.jpg')"
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background 0.5s ease',
        paddingTop: 'max(env(safe-area-inset-top), 1rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
      }}
    >
      {useNightSkyTheme && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(126,211,255,0.24),transparent_30%),radial-gradient(circle_at_80%_22%,rgba(67,120,255,0.18),transparent_26%),radial-gradient(circle_at_50%_82%,rgba(34,211,238,0.14),transparent_30%)]" />
      )}

      <div className="w-full min-h-screen flex flex-col items-center justify-center relative">
        <div
          className="absolute top-3 right-3 z-50"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <button
            onClick={() => setShowSettings(true)}
            aria-label="Game Mode Settings"
            className={
              useNightSkyTheme
                ? 'rounded-full p-2 text-white border border-[#bfe2ff]/18 bg-[linear-gradient(180deg,rgba(27,57,132,0.82),rgba(11,28,82,0.88))] backdrop-blur-sm shadow-[0_14px_24px_rgba(4,12,20,0.34)] hover:brightness-110'
                : 'bg-black/30 hover:bg-black/40 text-white rounded-full p-2 backdrop-blur-sm shadow-md'
            }
          >
            <FaCog size={22} />
          </button>
        </div>

        <div className="w-full max-w-lg sm:max-w-xl mx-auto px-1 sm:px-2 md:px-4 mb-3 sm:mb-4">
          <div className="relative h-4 sm:h-5 mb-1 sm:mb-2 flex flex-col justify-end">
            {isLightningMode && (
              <div className="flex justify-center items-center min-h-[2.5rem] sm:min-h-[3rem]">
                <span
                  className="text-4xl sm:text-5xl font-black text-yellow-300 drop-shadow-[0_0_20px_rgba(255,214,102,0.55)] inline-block scale-150"
                  style={{ transformOrigin: 'center' }}
                >
                  {lightningDisplay}
                </span>
              </div>
            )}
          </div>

          {isSurfMode && surfCorrectStreak > 0 && (
            <div className="flex justify-center items-center gap-8 mt-2 sm:mt-3 mb-4 sm:mb-5 text-2xl sm:text-3xl">
              {Array.from({ length: surfEmojiCount }).map((_, index) => (
                <span
                  key={`surf-emoji-${index}`}
                  role="img"
                  aria-label="surfboard rider"
                  className="inline-block"
                  style={{
                    transform: 'scale(2.5)',
                    transformOrigin: 'center',
                    filter: 'drop-shadow(0 0 18px rgba(143,215,255,0.34))',
                  }}
                >
                  {String.fromCodePoint(0x1f3c4)}
                </span>
              ))}
            </div>
          )}

          {isRocketMode && rocketEmojiCount > 0 && (
            <div className="flex justify-center items-center gap-8 mt-2 sm:mt-3 mb-4 sm:mb-5 text-2xl sm:text-3xl">
              {Array.from({ length: rocketEmojiCount }).map((_, index) => (
                <span
                  key={`rocket-emoji-${index}`}
                  role="img"
                  aria-label="rocket"
                  className="inline-block"
                  style={{
                    transform: 'scale(2.5)',
                    transformOrigin: 'center',
                    filter: 'drop-shadow(0 0 18px rgba(143,215,255,0.34))',
                  }}
                >
                  {String.fromCodePoint(0x1f680)}
                </span>
              ))}
            </div>
          )}

          {isBonusMode && (
            <div className="flex justify-center items-center min-h-[4.5rem] sm:min-h-[5.5rem] mt-2 sm:mt-3 mb-4 sm:mb-5 text-2xl sm:text-3xl">
              {bonusStarCount > 0 && (
                <div className="flex justify-center items-center gap-1 sm:gap-2">
                  {Array.from({ length: bonusStarCount }).map((_, index) => (
                    <span
                      key={`bonus-star-${index}`}
                      role="img"
                      aria-label="star"
                      className="inline-flex w-14 sm:w-16 justify-center text-[2.9rem] sm:text-[3.3rem] leading-none"
                      style={{
                        filter: 'drop-shadow(0 0 18px rgba(255,214,102,0.42))',
                      }}
                    >
                      {String.fromCodePoint(0x2b50)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={`w-full mx-auto px-1 sm:px-2 md:px-4 ${
            isSurfMode ? 'max-w-sm sm:max-w-md' : 'max-w-lg sm:max-w-xl'
          }`}
        >
          <div className={isSurfMode ? surfShellClassName : shellClassName}>
            {!isSurfMode && (
              <>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(126,211,255,0.22),transparent_70%)]" />
                <div className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-[#8fd7ff]/24 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#2d74ff]/14 blur-2xl" />
              </>
            )}

            <div className="text-center mb-4 sm:mb-5 md:mb-6">
              <h3 className="font-extrabold text-[#1ea672] mb-1 sm:mb-2 drop-shadow-[0_4px_12px_rgba(10,32,74,0.16)] text-6xl sm:text-7xl md:text-8xl whitespace-pre-line">
                {currentQuestion?.question || '1 + 1'}
              </h3>
            </div>

            {!isSurfMode && (
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3 w-full">
                {(currentQuestion?.answers || [1, 2, 3, 4]).map((answer, index) => (
                  <button
                    key={index}
                    ref={answerRefs.current[index]}
                    onClick={() => handleAnswerClick(answer)}
                    disabled={isAnimating || !currentQuestion || isTimerPaused || isAnswerSubmitted}
                    className={[
                      answerCardClassName,
                      'p-3 sm:p-4 md:p-6 border-2',
                      'transition-none select-none',
                      'disabled:bg-gray-200/80 disabled:opacity-100 disabled:cursor-default disabled:shadow-none',
                      'focus:outline-none focus:ring-0 active:outline-none active:ring-0',
                    ].join(' ')}
                    style={{
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div
                      className="text-xl sm:text-2xl md:text-3xl font-baloo text-[#344767] drop-shadow-[0_2px_6px_rgba(255,255,255,0.4)]"
                      style={{ fontFamily: 'Baloo 2, Comic Neue, cursive', letterSpacing: 2 }}
                    >
                      {currentQuestion?.answerLabels?.[answer] ?? answer}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {isSurfMode && (
              <div className="w-full max-w-sm mx-auto">
                <div className="w-full bg-white rounded-2xl h-24 flex items-center justify-center text-4xl font-extrabold shadow-lg border-4 border-green-300 text-gray-800 mb-4">
                  {typedInput === '' ? <span className="text-gray-400">Type answer</span> : typedInput}
                </div>

                <div className="grid gap-3 w-full max-w-sm mx-auto grid-cols-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleDigitPress(n)}
                      disabled={isAnimating || isTimerPaused || isAnswerSubmitted}
                      className={surfKeypadButtonClassName}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={handleClear}
                    disabled={isAnimating || isTimerPaused || isAnswerSubmitted}
                    className="bg-gray-200 text-gray-800 font-semibold py-2 rounded-xl shadow-md hover:bg-gray-300 active:scale-95 transition col-span-1 border border-gray-300"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => handleDigitPress(0)}
                    disabled={isAnimating || isTimerPaused || isAnswerSubmitted}
                    className={surfKeypadButtonClassName}
                  >
                    0
                  </button>
                  <button
                    onClick={handleSubmitTyped}
                    disabled={isAnimating || isTimerPaused || isAnswerSubmitted || typedInput === ''}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-2 rounded-xl shadow-md hover:from-green-600 hover:to-emerald-700 active:scale-95 transition col-span-1 disabled:opacity-55 disabled:cursor-default"
                  >
                    Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {showSettings && (
          <SettingsModal
            handleQuit={handleQuit}
            handleResetProgress={handleResetProgress}
            setShowSettings={setShowSettings}
          />
        )}
      </div>
    </div>
  );
};

export default GameModeScreen;
