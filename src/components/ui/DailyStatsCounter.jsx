import { useMathGameSelector } from '../../store/mathGameBridgeStore.js';
import StatsCardShell from './StatsCardShell.jsx';

const DailyStatsCounter = ({ style }) => {
  const dailyCorrect = useMathGameSelector((ctx) => ctx.correctCount ?? 0);

  return (
    <StatsCardShell style={style} icon={'\u{1F4DD}'} label="Today's Score" value={dailyCorrect} />
  );
};

export default DailyStatsCounter;
