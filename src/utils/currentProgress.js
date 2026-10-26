// Progress metadata is a display projection, not an unlock decision.
export const currentProgramProgress = (progress) => {
  const current = progress?._current;
  if (!current || !['add', 'sub', 'mul', 'div', 'frac'].includes(current.operation)
      || !Number.isInteger(current.level) || current.level < 1) return null;
  return { operation: current.operation, level: current.level,
    data: progress[current.operation]?.[`L${current.level}`] || { white: { unlocked: true } } };
};
