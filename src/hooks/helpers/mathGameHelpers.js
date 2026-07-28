import {
  DEFAULT_OPERATION,
  MODULE_SEQUENCE,
  normalizeOperation,
} from '../../config/modulesConfig.js';

export const readStoredNumber = (key, fallback) => {
  const stored = Number.parseInt(localStorage.getItem(key), 10);
  return Number.isFinite(stored) ? stored : fallback;
};

const hasFlatLevelKeys = (obj) =>
  !!obj && typeof obj === 'object' && Object.keys(obj).some((key) => /^L\d+$/i.test(key));

export const resolvePretestInactivityThresholdMs = (...sources) => {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;

    const fromPretestModeMs = Number(source?.pretestMode?.inactivityThresholdMs);
    if (Number.isFinite(fromPretestModeMs) && fromPretestModeMs >= 0) return fromPretestModeMs;

    const fromPretestModeSeconds = Number(source?.pretestMode?.inactivityThresholdSeconds);
    if (Number.isFinite(fromPretestModeSeconds) && fromPretestModeSeconds >= 0) {
      return Math.round(fromPretestModeSeconds * 1000);
    }

    const fromTopLevelMs = Number(source?.pretestInactivityThresholdMs);
    if (Number.isFinite(fromTopLevelMs) && fromTopLevelMs >= 0) return fromTopLevelMs;

    const fromGeneralMs = Number(source?.general?.pretestInactivityThresholdMs);
    if (Number.isFinite(fromGeneralMs) && fromGeneralMs >= 0) return fromGeneralMs;
  }

  return null;
};

export const resolveInactivityThresholdMs = (...sources) => {
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;

    const fromGeneralMs = Number(source?.general?.inactivityThresholdMs);
    if (Number.isFinite(fromGeneralMs) && fromGeneralMs >= 0) return fromGeneralMs;

    const fromGeneralSeconds = Number(source?.general?.inactivityThresholdSeconds);
    if (Number.isFinite(fromGeneralSeconds) && fromGeneralSeconds >= 0) {
      return Math.round(fromGeneralSeconds * 1000);
    }

    const fromTopLevelMs = Number(source?.inactivityThresholdMs);
    if (Number.isFinite(fromTopLevelMs) && fromTopLevelMs >= 0) return fromTopLevelMs;

    const fromTopLevelSeconds = Number(source?.inactivityThresholdSeconds);
    if (Number.isFinite(fromTopLevelSeconds) && fromTopLevelSeconds >= 0) {
      return Math.round(fromTopLevelSeconds * 1000);
    }

    const fromRunMs = Number(source?.run?.inactivityThresholdMs);
    if (Number.isFinite(fromRunMs) && fromRunMs >= 0) return fromRunMs;

    const fromRunSeconds = Number(source?.run?.inactivityThresholdSeconds);
    if (Number.isFinite(fromRunSeconds) && fromRunSeconds >= 0) {
      return Math.round(fromRunSeconds * 1000);
    }
  }

  return null;
};

export const normalizeProgressTree = (payload, fallbackOperation = DEFAULT_OPERATION) => {
  if (!payload || typeof payload !== 'object') return {};
  const source = payload?.progress && typeof payload.progress === 'object' ? payload.progress : payload;

  if (hasFlatLevelKeys(source)) {
    return { [normalizeOperation(fallbackOperation)]: source };
  }

  const tree = {};
  MODULE_SEQUENCE.forEach((op) => {
    if (source?.[op] && typeof source[op] === 'object') {
      tree[op] = source[op];
    }
  });
  return tree;
};

export const getOperationProgressSlice = (progressTree, operation) => {
  const op = normalizeOperation(operation);
  return progressTree?.[op] && typeof progressTree[op] === 'object' ? progressTree[op] : {};
};
