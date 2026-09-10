import React from 'react';
import DailyStatsCounter from './DailyStatsCounter.jsx';
import SessionTimer from './SessionTimer.jsx';
import CurrentLevelCounter from './CurrentLevelCounter.jsx';
import { useMathGamePick } from '../../store/mathGameBridgeStore.js';

const ScreenStatsDock = () => {
  const { totalTimeToday } =
    useMathGamePick((ctx) => ({
      totalTimeToday: Number.isFinite(ctx.totalTimeToday) ? ctx.totalTimeToday : 0,
    }));

  return (
    <div className="screen-stats-dock" aria-label="Daily stats">
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
        accumulatedTime={totalTimeToday}
        style={{
          width: '100%',
          maxWidth: '280px',
        }}
      />
    </div>
  );
};

export default ScreenStatsDock;
