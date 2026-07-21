import { useEffect, useMemo, useState } from 'react';
import { useMathGamePick } from '../../store/mathGameBridgeStore.js';
import StatsCardShell from './StatsCardShell.jsx';

const OPERATION_ORDER = ['add', 'sub', 'mul', 'div'];
const OP_LABEL = {
  add: 'Addition',
  sub: 'Subtraction',
  mul: 'Multiplication',
  div: 'Division',
};

const parseLevelsFromNode = (node = {}) =>
  Object.keys(node)
    .filter((k) => k.startsWith('L'))
    .map((k) => ({ level: parseInt(k.substring(1), 10), data: node[k] }))
    .filter((x) => Number.isFinite(x.level))
    .sort((a, b) => a.level - b.level);

const hasFlatLevelKeys = (node) =>
  !!node &&
  typeof node === 'object' &&
  Object.keys(node).some((key) => /^L\d+$/i.test(key));

const LEVEL_CACHE_PREFIX = 'math-current-level-label:';

const readCachedLevelLabel = (pin) => {
  const safePin = String(pin || '').trim();
  if (!safePin) return '--';
  const cached = localStorage.getItem(`${LEVEL_CACHE_PREFIX}${safePin}`);
  return cached && cached.trim() ? cached : '--';
};

const writeCachedLevelLabel = (pin, label) => {
  const safePin = String(pin || '').trim();
  const safeLabel = String(label || '').trim();
  if (!safePin || !safeLabel || safeLabel === '--') return;
  localStorage.setItem(`${LEVEL_CACHE_PREFIX}${safePin}`, safeLabel);
};

const pickCurrentLevelFromLevels = (levelsAsc = []) => {
  if (!levelsAsc.length) return null;
  const unlockedLevels = levelsAsc.filter((l) => !!l.data?.unlocked);
  const highestUnlockedIncomplete = [...unlockedLevels]
    .reverse()
    .find((l) => !l.data?.completed);
  return highestUnlockedIncomplete || unlockedLevels[unlockedLevels.length - 1] || levelsAsc[0];
};

const resolveCurrentLevel = (progressByOperation = {}, selectedOperation = 'add') => {
  const progress =
    progressByOperation && typeof progressByOperation === 'object'
      ? progressByOperation
      : {};

  if (!progress || typeof progress !== 'object') return '--';

  const hasScopedOps = OPERATION_ORDER.some(
    (op) => progress?.[op] && typeof progress[op] === 'object'
  );

  if (!hasScopedOps && hasFlatLevelKeys(progress)) {
    const flatLevels = parseLevelsFromNode(progress);
    const current = pickCurrentLevelFromLevels(flatLevels);
    return current ? `Level ${current.level}` : '--';
  }

  if (!hasScopedOps && progress?.[selectedOperation] && typeof progress[selectedOperation] === 'object') {
    const flatLevels = parseLevelsFromNode(progress[selectedOperation]);
    const current = pickCurrentLevelFromLevels(flatLevels);
    return current ? `${OP_LABEL[selectedOperation] || selectedOperation} Level ${current.level}` : '--';
  }

  const snapshots = OPERATION_ORDER.map((op) => {
    const levels = parseLevelsFromNode(progress?.[op] || {});
    if (!levels.length) return null;
    const current = pickCurrentLevelFromLevels(levels);
    if (!current || !current.data?.unlocked) return null;
    return { op, current };
  }).filter(Boolean);

  if (!snapshots.length) return '--';

  const highestUnlockedIncompleteOp = [...snapshots]
    .reverse()
    .find((entry) => !entry.current.data?.completed);
  const active = highestUnlockedIncompleteOp || snapshots[snapshots.length - 1];
  return `${OP_LABEL[active.op] || active.op} Level ${active.current.level}`;
};

const CurrentLevelCounter = ({ style }) => {
  const { childPin, progressByOperation, selectedOperation } = useMathGamePick((ctx) => ({
    childPin: ctx.childPin || '',
    progressByOperation: ctx.progressByOperation || {},
    selectedOperation: ctx.selectedOperation || 'add',
  }));
  const [levelLabel, setLevelLabel] = useState(() => readCachedLevelLabel(localStorage.getItem('math-child-pin') || ''));

  useEffect(() => {
    if (!childPin) {
      setLevelLabel('--');
      return;
    }
    setLevelLabel(readCachedLevelLabel(childPin));
  }, [childPin]);

  const liveLevelLabel = useMemo(
    () => resolveCurrentLevel(progressByOperation, selectedOperation),
    [progressByOperation, selectedOperation]
  );

  useEffect(() => {
    if (!childPin) return;
    if (!liveLevelLabel || liveLevelLabel === '--') return;
    setLevelLabel((prev) => (prev === liveLevelLabel ? prev : liveLevelLabel));
    writeCachedLevelLabel(childPin, liveLevelLabel);
  }, [childPin, liveLevelLabel]);

  const displayLevel = useMemo(() => levelLabel || '--', [levelLabel]);

  return (
    <StatsCardShell style={style} icon={'\u{1F3AF}'} label="Current Level" value={displayLevel} />
  );
};

export default CurrentLevelCounter;
