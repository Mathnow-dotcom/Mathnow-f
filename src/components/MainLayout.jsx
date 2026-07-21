import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { FaCog } from 'react-icons/fa';
import DailyStatsCounter from './ui/DailyStatsCounter';
import SessionTimer from './ui/SessionTimer';
import CurrentLevelCounter from './ui/CurrentLevelCounter.jsx';
import SettingsModal from './SettingsModal';
import UserInfoBadge from './ui/UserInfoBadge.jsx';
import DailyStreakCounter from './ui/DailyStreakCounter.jsx';
import { useMathGamePick } from '../store/mathGameBridgeStore.js';

const MainLayout = ({ hideStats }) => {
  const {
    showSettings,
    setShowSettings,
    isTimerPaused,
    quizStartTime,
    pausedTime,
    totalTimeToday,
    elapsedTime,
    handleQuit,
    handleResetProgress,
  } = useMathGamePick((ctx) => ({
    showSettings: Boolean(ctx.showSettings),
    setShowSettings: ctx.setShowSettings || (() => {}),
    isTimerPaused: Boolean(ctx.isTimerPaused),
    quizStartTime: ctx.quizStartTime || null,
    pausedTime: ctx.pausedTime || 0,
    totalTimeToday: Number.isFinite(ctx.totalTimeToday) ? ctx.totalTimeToday : 0,
    elapsedTime: Number.isFinite(ctx.elapsedTime) ? ctx.elapsedTime : 0,
    handleQuit: ctx.handleQuit || (() => {}),
    handleResetProgress: ctx.handleResetProgress || (() => {}),
  }));

  const location = useLocation();

  const showStats = !(location.pathname === '/' || location.pathname === '/name');
  const shouldRenderStats = showStats && !hideStats;
  const hideSettingsButton = location.pathname === '/way-to-go';

  // Fallback so we always pass a number down to SessionTimer
  const effectiveAccumulatedTime =
    typeof totalTimeToday === 'number' ? totalTimeToday : elapsedTime || 0;

  return (
    <div
      className="App min-h-screen w-full relative layout-has-stats"
      style={{
        background:
          'linear-gradient(135deg, #23272f 0%, #18181b 60%, #111113 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background 0.5s ease',
      }}
    >
      <div
        className="fixed z-50 flex items-center gap-2 sm:gap-3 select-none"
        style={{
          top: 'max(env(safe-area-inset-top), 1.8rem)',
          right: 'max(env(safe-area-inset-right), 1.2rem)',
          transform: 'translateY(-2px)',
        }}
      >
        <DailyStreakCounter />
        <UserInfoBadge />
        {!hideSettingsButton && (
          <button
            className="z-[60] flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border-0 bg-[radial-gradient(circle_at_top_left,_rgba(88,148,255,0.18),_rgba(16,36,101,0.94)_36%,_rgba(8,18,58,0.98)_100%)] text-white shadow-[0_12px_26px_rgba(5,16,54,0.42),0_0_18px_rgba(44,108,255,0.16)] outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 transition-all duration-300 hover:scale-105 active:scale-95"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
          >
            <FaCog className="text-[2.45rem] sm:text-[2.6rem]" />
          </button>
        )}
      </div>

      {/* Routed pages */}
      <div className="w-full min-h-screen flex flex-col">
        <div className="flex-1 w-full">
          <Outlet />
        </div>

        {/* Responsive stats bar (score + time) */}
        {shouldRenderStats && (
          <div className="stats-floating">
            <CurrentLevelCounter
              style={{
                width: '100%',
                maxWidth: '280px',
              }}
            />
            <DailyStatsCounter
              style={{
                width: '100%',
                maxWidth: '280px',
              }}
            />
            <SessionTimer
              isActive={!!quizStartTime}
              startTime={quizStartTime}
              isPaused={isTimerPaused}
              pauseStartTime={pausedTime}
              accumulatedTime={effectiveAccumulatedTime}
              style={{
                width: '100%',
                maxWidth: '280px',
              }}
            />
          </div>
        )}
      </div>

      {showSettings && (
        <SettingsModal
          handleQuit={handleQuit}
          handleResetProgress={handleResetProgress}
          setShowSettings={setShowSettings}
        />
      )}
    </div>
  );
};

export default MainLayout;
