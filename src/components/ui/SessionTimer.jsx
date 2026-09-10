import React from 'react';
import StatsCardShell from './StatsCardShell.jsx';

const SessionTimer = ({ style, accumulatedTime = 0 }) => {

  const totalTimeSeconds = accumulatedTime;
  const hours = Math.floor(totalTimeSeconds / 3600);
  const mins = Math.floor((totalTimeSeconds % 3600) / 60);
  const secs = totalTimeSeconds % 60;

  return (
    <StatsCardShell
      style={style}
      icon="\u23F0"
      label="Today's Total Time"
      value={`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`}
    />
  );
};

export default SessionTimer;
