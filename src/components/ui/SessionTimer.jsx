import React from 'react';
import StatsCardShell from './StatsCardShell.jsx';

const SessionTimer = ({ isActive, startTime, style, isPaused, pauseStartTime, accumulatedTime = 0 }) => {
  void startTime;
  void pauseStartTime;

  const totalTimeSeconds = accumulatedTime;
  const hours = Math.floor(totalTimeSeconds / 3600);
  const mins = Math.floor((totalTimeSeconds % 3600) / 60);
  const secs = totalTimeSeconds % 60;

  return (
    <StatsCardShell
      style={style}
      icon={!isActive ? '\u23F0' : isPaused ? '\u23F8\uFE0F' : '\u23F0'}
      label="Time Today"
      value={`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`}
      status={!isActive && totalTimeSeconds === 0 ? 'idle' : isActive && isPaused ? 'paused' : undefined}
    />
  );
};

export default SessionTimer;
