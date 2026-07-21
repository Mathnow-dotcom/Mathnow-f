import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { FaArrowRight, FaBullseye, FaClock, FaStar, FaTrophy } from 'react-icons/fa';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const StatCard = ({ icon: Icon, iconWrapClass, label, value, valueClass }) => (
    <div className="rounded-[1.05rem] border border-blue-200/80 bg-gradient-to-b from-white via-[#f9fbff] to-[#eef5ff] p-2.5 text-left shadow-[0_10px_22px_rgba(15,23,42,0.14)] sm:rounded-[1.45rem] sm:p-4">
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
            <span className="font-black text-[#33406f] text-[clamp(0.76rem,1.9vw,1.35rem)]">
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

const WayToGoScreen = () => {
    const navigate = useNavigate();
    const {
        selectedDifficulty,
        selectedOperation,
        selectedTable,
        sessionCorrectCount,
        correctCount,
        grandTotalCorrect,
        startQuizWithDifficulty,
        setQuizRunId,
        setSelectedDifficulty,
        setSelectedTable,
        isQuizStarting,
        showWayToGoAfterFailure,
    } = useMathGamePick((ctx) => ({
        selectedDifficulty: ctx.selectedDifficulty,
        selectedOperation: ctx.selectedOperation,
        selectedTable: ctx.selectedTable,
        sessionCorrectCount: Number.isFinite(ctx.sessionCorrectCount) ? ctx.sessionCorrectCount : 0,
        correctCount: Number.isFinite(ctx.correctCount) ? ctx.correctCount : 0,
        grandTotalCorrect: Number.isFinite(ctx.grandTotalCorrect) ? ctx.grandTotalCorrect : 0,
        startQuizWithDifficulty: ctx.startQuizWithDifficulty || (() => {}),
        setQuizRunId: ctx.setQuizRunId || (() => {}),
        setSelectedDifficulty: ctx.setSelectedDifficulty || (() => {}),
        setSelectedTable: ctx.setSelectedTable || (() => {}),
        isQuizStarting: Boolean(ctx.isQuizStarting),
        showWayToGoAfterFailure: Boolean(ctx.showWayToGoAfterFailure),
    }));

    const AUTO_NAV_KEY = 'math-waytogo-auto-nav-once';

    const [displaySessionScore] = useState(sessionCorrectCount);
    const [displayTimeSecs] = useState(() => {
        const ls = Number(localStorage.getItem('math-last-quiz-duration') || 0);
        return Number.isFinite(ls) ? ls : 0;
    });
    const hasRestarted = useRef(false);
    const [countdown, setCountdown] = useState(5);

    const sessionTimeSecs = Math.round(displayTimeSecs);
    const sessionTimeLabel = `${sessionTimeSecs}s`;

    useEffect(() => {
        if (!selectedTable || !selectedDifficulty) return;
        if (showWayToGoAfterFailure) return;

        let intervalId;

        if (countdown > 0) {
            intervalId = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (countdown === 0) {
            if (hasRestarted.current) return;
            hasRestarted.current = true;

            if (showWayToGoAfterFailure) {
                localStorage.setItem('game-mode-belt', selectedDifficulty);
                localStorage.setItem('game-mode-table', String(selectedTable));
                localStorage.setItem('game-mode-operation', selectedOperation || 'add');
                navigate('/game-mode-video', { replace: true });
                return;
            }

            localStorage.removeItem('math-last-quiz-duration');

            if (selectedTable && selectedDifficulty) {
                startQuizWithDifficulty(selectedDifficulty, selectedTable);
            } else {
                navigate('/belts');
            }
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [
        countdown,
        navigate,
        selectedDifficulty,
        selectedOperation,
        selectedTable,
        startQuizWithDifficulty,
        showWayToGoAfterFailure,
    ]);

    useEffect(() => {
        if (!showWayToGoAfterFailure) return;
        const timer = setTimeout(() => {
            if (hasRestarted.current) return;
            hasRestarted.current = true;

            localStorage.setItem('game-mode-belt', selectedDifficulty);
            localStorage.setItem('game-mode-table', String(selectedTable));
            localStorage.setItem('game-mode-operation', selectedOperation || 'add');
            navigate('/game-mode-video', { replace: true });
        }, 5000);

        return () => clearTimeout(timer);
    }, [
        showWayToGoAfterFailure,
        selectedDifficulty,
        selectedOperation,
        selectedTable,
        navigate,
    ]);

    const handleBackToBelts = () => {
        hasRestarted.current = true;
        setQuizRunId(null);
        setSelectedDifficulty(null);
        const isBlackBelt = String(selectedDifficulty).startsWith('black');
        if (isBlackBelt) {
            navigate('/black');
        } else {
            navigate('/belts');
        }
    };

    const handleContinueToGameModeIntro = () => {
        if (hasRestarted.current) return;
        hasRestarted.current = true;
        localStorage.setItem('game-mode-belt', selectedDifficulty);
        localStorage.setItem('game-mode-table', String(selectedTable));
        localStorage.setItem('game-mode-operation', selectedOperation || 'add');
        navigate('/game-mode-video', { replace: true });
    };

    const beltName = String(selectedDifficulty).startsWith('black')
        ? `Black (Degree ${selectedDifficulty.split('-')[1]})`
        : selectedDifficulty?.charAt(0).toUpperCase() + selectedDifficulty?.slice(1);

    const isDisabled = isQuizStarting;

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
            <Confetti
                width={window.innerWidth}
                height={window.innerHeight}
                numberOfPieces={160}
                gravity={0.5}
                run
                recycle={false}
                style={{ position: 'fixed', inset: 0, zIndex: 40, pointerEvents: 'none' }}
            />

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
                            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(248,113,113,0.2),_transparent_68%)]" />
                            <div className="absolute left-5 top-6 h-2 w-2 rotate-12 rounded-sm bg-[#ff9258]" />
                            <div className="absolute left-10 top-16 h-3 w-3 rotate-45 rounded-sm bg-[#ffd95f]" />
                            <div className="absolute left-[18%] top-10 h-3 w-3 -rotate-12 rounded-sm bg-[#4be4d4]" />
                            <div className="absolute right-8 top-7 h-2.5 w-2.5 rotate-45 rounded-sm bg-[#ff7ab6]" />
                            <div className="absolute right-14 top-14 h-3 w-3 -rotate-12 rounded-sm bg-[#ffd95f]" />
                            <div className="absolute right-[21%] top-11 h-2.5 w-2.5 rotate-12 rounded-sm bg-[#76b7ff]" />
                            <div className="absolute left-6 bottom-10 h-3 w-3 rounded-full bg-white/80 blur-[1px]" />
                            <div className="absolute right-7 bottom-12 h-3 w-3 rounded-full bg-white/80 blur-[1px]" />
                        </div>

                        <div className="relative mx-auto mb-7 w-full max-w-[31rem] px-1 sm:mb-9">
                            <div className="pointer-events-none absolute -left-2 top-1/2 hidden h-7 w-9 -translate-y-1/2 skew-y-[-10deg] rounded-l-md bg-gradient-to-b from-[#38bdf8] to-[#0284c7] shadow-md min-[440px]:block sm:-left-3 sm:h-10 sm:w-14" />
                            <div className="pointer-events-none absolute -right-2 top-1/2 hidden h-7 w-9 -translate-y-1/2 skew-y-[10deg] rounded-r-md bg-gradient-to-b from-[#38bdf8] to-[#0284c7] shadow-md min-[440px]:block sm:-right-3 sm:h-10 sm:w-14" />
                            <div className="relative rounded-[1rem] border border-[#7dd3fc] bg-gradient-to-r from-[#38bdf8] via-[#0ea5e9] to-[#0284c7] px-3 py-2.5 text-center shadow-[inset_0_2px_0_rgba(186,230,253,0.6),0_10px_22px_rgba(2,132,199,0.3)] sm:rounded-[1.3rem] sm:px-5 sm:py-3.5">
                                <h2
                                    className="m-0 text-[clamp(0.95rem,4.8vw,2.6rem)] font-black uppercase tracking-[0.12em] text-white"
                                    style={{ textShadow: '0 3px 0 rgba(2,132,199,0.5), 0 7px 14px rgba(2,132,199,0.25)' }}
                                >
                                    Way To Go
                                </h2>
                            </div>
                        </div>

                        <div className="mb-3.5 grid grid-cols-2 gap-2 sm:mb-5 sm:gap-3">
                            <StatCard
                                icon={FaBullseye}
                                iconWrapClass="border border-purple-200 bg-gradient-to-b from-[#f1e8ff] to-[#e5d5ff] text-purple-600"
                                label="Session Score"
                                value={displaySessionScore}
                                valueClass="text-cyan-500"
                            />
                            <StatCard
                                icon={FaClock}
                                iconWrapClass="border border-sky-200 bg-gradient-to-b from-[#e0f2fe] to-[#c7e8ff] text-sky-600"
                                label="Time Taken"
                                value={sessionTimeLabel}
                                valueClass="text-cyan-500"
                            />
                            <StatCard
                                icon={FaStar}
                                iconWrapClass="border border-amber-200 bg-gradient-to-b from-[#fff2cf] to-[#ffe4a3] text-amber-500"
                                label="Today's Score"
                                value={correctCount}
                                valueClass="text-cyan-500"
                            />
                            <StatCard
                                icon={FaTrophy}
                                iconWrapClass="border border-lime-200 bg-gradient-to-b from-[#ebffd9] to-[#d7f8b8] text-lime-600"
                                label="Total Score"
                                value={grandTotalCorrect}
                                valueClass="text-cyan-500"
                            />
                        </div>

                        <div className="mx-auto mb-3.5 flex w-full max-w-[30rem] items-center justify-center rounded-[1rem] border border-[#f4dc98] bg-gradient-to-b from-[#fff6db] to-[#f7ebc5] px-3 py-2 text-center shadow-[inset_0_2px_0_rgba(255,255,255,0.9),0_8px_18px_rgba(30,41,59,0.12)] sm:mb-5 sm:px-4 sm:py-3">
                            <p className="m-0 font-extrabold text-[clamp(0.78rem,2.7vw,1.45rem)] text-[#34406a]">
                                Keep going on  <span className="text-orange-500">{beltName} Belt</span>
                            </p>
                        </div>

                        {showWayToGoAfterFailure ? (
                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={handleContinueToGameModeIntro}
                                    className="m-0 inline-flex w-full max-w-[16.75rem] items-center justify-center gap-2 rounded-full border border-[#5bd46e] bg-gradient-to-b from-[#49de68] via-[#28c652] to-[#15953c] px-3.5 py-2.5 text-[clamp(0.88rem,2.8vw,1.45rem)] font-black text-white shadow-[inset_0_2px_0_rgba(215,255,220,0.8),0_12px_24px_rgba(22,163,74,0.35)] transition hover:opacity-95 sm:max-w-[20rem] sm:gap-2.5 sm:px-4 sm:text-[clamp(1rem,3vw,1.45rem)]"
                                >
                                     Game Mode
                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-emerald-600 shadow-inner sm:h-8 sm:w-8">
                                        <FaArrowRight className="text-sm sm:text-base" />
                                    </span>
                                </button>
                            </div>
                        ) : (
                            <div className="mx-auto max-w-[22rem] rounded-[1rem] border border-cyan-100/20 bg-slate-950/48 px-4 py-3 text-center shadow-[inset_0_0_24px_rgba(34,211,238,0.12)]">
                                <p className="m-0 text-[clamp(0.95rem,3vw,1.4rem)] font-black text-white">
                                    {showWayToGoAfterFailure ? 'Game Mode In ' : 'Retry in '}
                                    <span className="text-red-400">{countdown}</span> seconds...
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WayToGoScreen;
