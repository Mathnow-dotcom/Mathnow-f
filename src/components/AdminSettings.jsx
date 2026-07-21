import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBolt,
  FaBullseye,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaKey,
  FaQuestionCircle,
  FaRocket,
  FaSave,
  FaShieldAlt,
  FaStar,
  FaStopwatch,
  FaSyncAlt,
  FaTrophy,
  FaUndoAlt,
} from 'react-icons/fa';
import {
  getAppConfig,
  reloadAppConfig,
  restoreUserProgress,
  resetAppConfig,
  updateAdminPin,
  updateAppConfig,
  updateBlackBeltTimer,
} from '../api/mathApi.js';

const DEFAULT_NUMBERS = {
  blackDegree1: 60,
  blackDegree2: 55,
  blackDegree3: 50,
  blackDegree4: 45,
  blackDegree5: 40,
  blackDegree6: 35,
  blackDegree7: 60,
  lightningTarget: 5,
  lightningTimer: 2,
  surfQuestionsPerQuiz: 5,
  surfQuizzesRequired: 5,
  rocketQuestionsPerQuiz: 5,
  rocketQuizzesRequired: 5,
  bonusTargetCorrect: 20,
  bonusVideoIntervalCorrect: 5,
  bonusQuestionsPerBatch: 20,
  inactivityTimer: 60,
  pretestInactivityTimer: 3,
  pretestQuestionCount: 20,
  pretestDefaultTimer: 50,
};
const PRETEST_LEVEL_COUNT = 19;
const RESTORE_OPERATION_KEYS = ['add', 'sub', 'mul', 'div'];
const TOAST_DURATION_MS = 1500;

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const timerSeconds = (timer, fallback) => {
  if (!timer) return fallback;
  if (Number.isFinite(timer.seconds)) return timer.seconds;
  if (Number.isFinite(timer.ms)) return Math.round(timer.ms / 1000);
  return fallback;
};

const buildEmptyPretestLevelTimers = () =>
  Object.fromEntries(
    Array.from({ length: PRETEST_LEVEL_COUNT }, (_, idx) => [String(idx + 1), ''])
  );

const parseLevelFromKey = (key) => {
  if (typeof key !== 'string') return null;
  if (key.startsWith('level')) {
    return Number.parseInt(key.replace('level', ''), 10);
  }
  return Number.parseInt(key, 10);
};

const parseSecondsFromTimerValue = (value) => {
  if (Number.isFinite(value)) {
    return value >= 1000 ? Math.round(value / 1000) : Math.round(value);
  }
  if (!value || typeof value !== 'object') return null;
  if (Number.isFinite(value.seconds)) return Math.round(value.seconds);
  if (Number.isFinite(value.ms)) return Math.round(value.ms / 1000);
  return null;
};

const mapPretestLevelTimers = (resolved) => {
  const mapped = buildEmptyPretestLevelTimers();
  const sources = [
    resolved?.pretestMode?.timeLimitsPerLevel,
    resolved?.pretestMode?.timeLimitsPerLevelMs,
    resolved?.pretestTimeLimitsPerLevelMs,
  ];

  sources.forEach((source) => {
    if (!source || typeof source !== 'object') return;
    Object.entries(source).forEach(([key, value]) => {
      const level = parseLevelFromKey(key);
      if (!Number.isInteger(level) || level < 1 || level > PRETEST_LEVEL_COUNT) return;
      const seconds = parseSecondsFromTimerValue(value);
      if (Number.isFinite(seconds) && seconds > 0) {
        mapped[String(level)] = String(seconds);
      }
    });
  });

  return mapped;
};

const isPretestLevelTimersEqual = (a = {}, b = {}) => {
  for (let level = 1; level <= PRETEST_LEVEL_COUNT; level += 1) {
    const key = String(level);
    if ((a[key] ?? '') !== (b[key] ?? '')) return false;
  }
  return true;
};

const mapConfigToValues = (config) => {
  const resolved = config?.config ?? config;
  return {
    blackDegree1: String(timerSeconds(resolved?.blackBeltTimers?.degree1, DEFAULT_NUMBERS.blackDegree1)),
    blackDegree2: String(timerSeconds(resolved?.blackBeltTimers?.degree2, DEFAULT_NUMBERS.blackDegree2)),
    blackDegree3: String(timerSeconds(resolved?.blackBeltTimers?.degree3, DEFAULT_NUMBERS.blackDegree3)),
    blackDegree4: String(timerSeconds(resolved?.blackBeltTimers?.degree4, DEFAULT_NUMBERS.blackDegree4)),
    blackDegree5: String(timerSeconds(resolved?.blackBeltTimers?.degree5, DEFAULT_NUMBERS.blackDegree5)),
    blackDegree6: String(timerSeconds(resolved?.blackBeltTimers?.degree6, DEFAULT_NUMBERS.blackDegree6)),
    blackDegree7: String(timerSeconds(resolved?.blackBeltTimers?.degree7, DEFAULT_NUMBERS.blackDegree7)),
    lightningTarget: String(
      Number.isFinite(resolved?.lightningMode?.targetCorrect)
        ? resolved.lightningMode.targetCorrect
        : DEFAULT_NUMBERS.lightningTarget
    ),
    lightningTimer: String(
      Number.isFinite(resolved?.lightningMode?.fastThresholdSeconds)
        ? resolved.lightningMode.fastThresholdSeconds
        : Number.isFinite(resolved?.lightningMode?.fastThresholdMs)
        ? Math.round(resolved.lightningMode.fastThresholdMs / 1000)
        : DEFAULT_NUMBERS.lightningTimer
    ),
    surfQuestionsPerQuiz: String(
      Number.isFinite(resolved?.surfMode?.questionsPerQuiz)
        ? resolved.surfMode.questionsPerQuiz
        : DEFAULT_NUMBERS.surfQuestionsPerQuiz
    ),
    surfQuizzesRequired: String(
      Number.isFinite(resolved?.surfMode?.quizzesRequired)
        ? resolved.surfMode.quizzesRequired
        : DEFAULT_NUMBERS.surfQuizzesRequired
    ),
    rocketQuestionsPerQuiz: String(
      Number.isFinite(resolved?.rocketMode?.questionsPerQuiz)
        ? resolved.rocketMode.questionsPerQuiz
        : DEFAULT_NUMBERS.rocketQuestionsPerQuiz
    ),
    rocketQuizzesRequired: String(
      Number.isFinite(resolved?.rocketMode?.quizzesRequired)
        ? resolved.rocketMode.quizzesRequired
        : DEFAULT_NUMBERS.rocketQuizzesRequired
    ),
    bonusTargetCorrect: String(
      Number.isFinite(resolved?.bonusMode?.targetCorrect)
        ? resolved.bonusMode.targetCorrect
        : DEFAULT_NUMBERS.bonusTargetCorrect
    ),
    bonusVideoIntervalCorrect: String(
      Number.isFinite(resolved?.bonusMode?.videoIntervalCorrect)
        ? resolved.bonusMode.videoIntervalCorrect
        : DEFAULT_NUMBERS.bonusVideoIntervalCorrect
    ),
    bonusQuestionsPerBatch: String(
      Number.isFinite(resolved?.bonusMode?.questionsPerBatch)
        ? resolved.bonusMode.questionsPerBatch
        : DEFAULT_NUMBERS.bonusQuestionsPerBatch
    ),
    inactivityTimer: String(
      Number.isFinite(resolved?.general?.inactivityThresholdSeconds)
        ? resolved.general.inactivityThresholdSeconds
        : Number.isFinite(resolved?.general?.inactivityThresholdMs)
        ? Math.round(resolved.general.inactivityThresholdMs / 1000)
        : DEFAULT_NUMBERS.inactivityTimer
    ),
    pretestQuestionCount: String(
      Number.isFinite(resolved?.pretestMode?.questionCount)
        ? resolved.pretestMode.questionCount
        : Number.isFinite(resolved?.general?.pretestQuestionCount)
        ? resolved.general.pretestQuestionCount
        : DEFAULT_NUMBERS.pretestQuestionCount
    ),
    pretestDefaultTimer: String(
      Number.isFinite(resolved?.pretestMode?.defaultTimeLimitSeconds)
        ? Math.round(resolved.pretestMode.defaultTimeLimitSeconds)
        : Number.isFinite(resolved?.pretestMode?.defaultTimeLimitMs)
        ? Math.round(resolved.pretestMode.defaultTimeLimitMs / 1000)
        : Number.isFinite(resolved?.pretestMode?.timeLimitSeconds)
        ? Math.round(resolved.pretestMode.timeLimitSeconds)
        : Number.isFinite(resolved?.pretestMode?.timeLimitMs)
        ? Math.round(resolved.pretestMode.timeLimitMs / 1000)
        : Number.isFinite(resolved?.general?.pretestTimeLimitMs)
        ? Math.round(resolved.general.pretestTimeLimitMs / 1000)
        : DEFAULT_NUMBERS.pretestDefaultTimer
    ),
    pretestInactivityTimer: String(
      Number.isFinite(resolved?.pretestMode?.inactivityThresholdSeconds)
        ? Math.round(resolved.pretestMode.inactivityThresholdSeconds)
        : Number.isFinite(resolved?.pretestMode?.inactivityThresholdMs)
        ? Math.round(resolved.pretestMode.inactivityThresholdMs / 1000)
        : Number.isFinite(resolved?.general?.pretestInactivityThresholdMs)
        ? Math.round(resolved.general.pretestInactivityThresholdMs / 1000)
        : Number.isFinite(resolved?.pretestInactivityThresholdMs)
        ? Math.round(resolved.pretestInactivityThresholdMs / 1000)
        : DEFAULT_NUMBERS.pretestInactivityTimer
    ),
    pretestTimersPerLevel: mapPretestLevelTimers(resolved),
  };
};

const buildTimer = (seconds) => ({
  ms: seconds * 1000,
  seconds,
  display: `${seconds} sec`,
});

const buildConfigPayload = (values) => {
  const lightningTarget = toInt(values.lightningTarget, DEFAULT_NUMBERS.lightningTarget);
  const lightningTimer = toInt(values.lightningTimer, DEFAULT_NUMBERS.lightningTimer);
  const surfQuestionsPerQuiz = toInt(values.surfQuestionsPerQuiz, DEFAULT_NUMBERS.surfQuestionsPerQuiz);
  const surfQuizzesRequired = toInt(values.surfQuizzesRequired, DEFAULT_NUMBERS.surfQuizzesRequired);
  const rocketQuestionsPerQuiz = toInt(
    values.rocketQuestionsPerQuiz,
    DEFAULT_NUMBERS.rocketQuestionsPerQuiz
  );
  const rocketQuizzesRequired = toInt(
    values.rocketQuizzesRequired,
    DEFAULT_NUMBERS.rocketQuizzesRequired
  );
  const bonusTargetCorrect = toInt(values.bonusTargetCorrect, DEFAULT_NUMBERS.bonusTargetCorrect);
  const bonusVideoIntervalCorrect = toInt(
    values.bonusVideoIntervalCorrect,
    DEFAULT_NUMBERS.bonusVideoIntervalCorrect
  );
  const bonusQuestionsPerBatch = toInt(
    values.bonusQuestionsPerBatch,
    DEFAULT_NUMBERS.bonusQuestionsPerBatch
  );
  const inactivityTimer = toInt(values.inactivityTimer, DEFAULT_NUMBERS.inactivityTimer);
  const pretestInactivityTimer = toInt(
    values.pretestInactivityTimer,
    DEFAULT_NUMBERS.pretestInactivityTimer
  );
  const pretestQuestionCount = toInt(values.pretestQuestionCount, DEFAULT_NUMBERS.pretestQuestionCount);

  return {
    lightningTargetCorrect: lightningTarget,
    lightningFastThresholdMs: lightningTimer * 1000,
    surfQuestionsPerQuiz,
    surfQuizzesRequired,
    rocketQuestionsPerQuiz,
    rocketQuizzesRequired,
    bonusTargetCorrect,
    bonusVideoIntervalCorrect,
    bonusQuestionsPerBatch,
    inactivityThresholdMs: inactivityTimer * 1000,
    pretestInactivityThresholdMs: pretestInactivityTimer * 1000,
    pretestQuestionCount,
    pretestMode: {
      questionCount: pretestQuestionCount,
    },
  };
};

const SectionCard = ({
  icon: Icon,
  iconClass,
  title,
  subtitle,
  children,
  className = '',
  headerAction = null,
}) => (
  <section
    className={`h-fit self-start rounded-[1.5rem] border border-[#4d8be6]/38 bg-[linear-gradient(180deg,rgba(10,27,70,0.85),rgba(7,21,58,0.78))] p-4 shadow-[0_18px_44px_rgba(0,8,26,0.42),inset_0_1px_0_rgba(224,239,255,0.08)] backdrop-blur-xl sm:p-5 ${className}`}
  >
    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border bg-[radial-gradient(circle_at_top_left,_rgba(88,148,255,0.2),_rgba(16,36,101,0.96)_36%,_rgba(8,18,58,0.98)_100%)] shadow-[inset_0_1px_0_rgba(194,225,255,0.16)] ${iconClass}`}
        >
          <Icon className="text-[1.15rem]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[1.05rem] font-extrabold leading-tight text-white sm:text-[1.25rem]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-[0.84rem] leading-[1.3] text-[#9fb6db] sm:text-[0.92rem]">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {headerAction ? (
        <div className="ml-auto flex shrink-0 items-start">
          {headerAction}
        </div>
      ) : null}
    </div>
    {children}
  </section>
);

const SettingField = ({
  label,
  description,
  icon: Icon,
  iconClass = 'text-[#74d3ff]',
  children,
  className = '',
  contentClassName = '',
}) => (
  <label
    className={`group flex w-full flex-col gap-2 rounded-[1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(13,33,85,0.74),rgba(8,24,64,0.58))] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors hover:border-[#5fd5ff]/25 ${className}`}
  >
    <div className="flex min-w-0 items-center gap-3">
      {Icon ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(7,23,63,0.92),rgba(8,20,52,0.8))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <Icon className={`text-[0.95rem] ${iconClass}`} aria-hidden="true" />
        </div>
      ) : null}
      <div className="min-w-0">
        <div className="text-[0.94rem] font-semibold leading-[1.2] break-words text-white">{label}</div>
        {description ? (
          <div className="mt-0.5 text-[0.78rem] leading-[1.3] text-[#95acd2]">{description}</div>
        ) : null}
      </div>
    </div>
    <div className={`w-full ${contentClassName}`}>{children}</div>
  </label>
);

const AdminSettings = () => {
  const navigate = useNavigate();
  const [adminPin, setAdminPin] = useState(() => localStorage.getItem('math-admin-pin'));

  useEffect(() => {
    if (!adminPin) {
      navigate('/name', { replace: true });
    }
  }, [adminPin, navigate]);

  const dashboardStyle = useMemo(
    () => ({
      minHeight: '100vh',
      paddingTop: 'max(env(safe-area-inset-top), 1rem)',
      paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
      background:
        'radial-gradient(1100px 540px at 16% -10%, rgba(36, 133, 255, 0.32), transparent 60%), radial-gradient(920px 500px at 88% 4%, rgba(53, 211, 255, 0.2), transparent 56%), linear-gradient(140deg, #030711 0%, #051126 44%, #021121 100%)',
    }),
    []
  );

  const [values, setValues] = useState(() => ({
    blackDegree1: String(DEFAULT_NUMBERS.blackDegree1),
    blackDegree2: String(DEFAULT_NUMBERS.blackDegree2),
    blackDegree3: String(DEFAULT_NUMBERS.blackDegree3),
    blackDegree4: String(DEFAULT_NUMBERS.blackDegree4),
    blackDegree5: String(DEFAULT_NUMBERS.blackDegree5),
    blackDegree6: String(DEFAULT_NUMBERS.blackDegree6),
    blackDegree7: String(DEFAULT_NUMBERS.blackDegree7),
    lightningTarget: String(DEFAULT_NUMBERS.lightningTarget),
    lightningTimer: String(DEFAULT_NUMBERS.lightningTimer),
    surfQuestionsPerQuiz: String(DEFAULT_NUMBERS.surfQuestionsPerQuiz),
    surfQuizzesRequired: String(DEFAULT_NUMBERS.surfQuizzesRequired),
    rocketQuestionsPerQuiz: String(DEFAULT_NUMBERS.rocketQuestionsPerQuiz),
    rocketQuizzesRequired: String(DEFAULT_NUMBERS.rocketQuizzesRequired),
    bonusTargetCorrect: String(DEFAULT_NUMBERS.bonusTargetCorrect),
    bonusVideoIntervalCorrect: String(DEFAULT_NUMBERS.bonusVideoIntervalCorrect),
    bonusQuestionsPerBatch: String(DEFAULT_NUMBERS.bonusQuestionsPerBatch),
    inactivityTimer: String(DEFAULT_NUMBERS.inactivityTimer),
    pretestInactivityTimer: String(DEFAULT_NUMBERS.pretestInactivityTimer),
    pretestQuestionCount: String(DEFAULT_NUMBERS.pretestQuestionCount),
    pretestDefaultTimer: String(DEFAULT_NUMBERS.pretestDefaultTimer),
    pretestTimersPerLevel: buildEmptyPretestLevelTimers(),
  }));
  const [baselineValues, setBaselineValues] = useState(() => ({
    blackDegree1: String(DEFAULT_NUMBERS.blackDegree1),
    blackDegree2: String(DEFAULT_NUMBERS.blackDegree2),
    blackDegree3: String(DEFAULT_NUMBERS.blackDegree3),
    blackDegree4: String(DEFAULT_NUMBERS.blackDegree4),
    blackDegree5: String(DEFAULT_NUMBERS.blackDegree5),
    blackDegree6: String(DEFAULT_NUMBERS.blackDegree6),
    blackDegree7: String(DEFAULT_NUMBERS.blackDegree7),
    lightningTarget: String(DEFAULT_NUMBERS.lightningTarget),
    lightningTimer: String(DEFAULT_NUMBERS.lightningTimer),
    surfQuestionsPerQuiz: String(DEFAULT_NUMBERS.surfQuestionsPerQuiz),
    surfQuizzesRequired: String(DEFAULT_NUMBERS.surfQuizzesRequired),
    rocketQuestionsPerQuiz: String(DEFAULT_NUMBERS.rocketQuestionsPerQuiz),
    rocketQuizzesRequired: String(DEFAULT_NUMBERS.rocketQuizzesRequired),
    bonusTargetCorrect: String(DEFAULT_NUMBERS.bonusTargetCorrect),
    bonusVideoIntervalCorrect: String(DEFAULT_NUMBERS.bonusVideoIntervalCorrect),
    bonusQuestionsPerBatch: String(DEFAULT_NUMBERS.bonusQuestionsPerBatch),
    inactivityTimer: String(DEFAULT_NUMBERS.inactivityTimer),
    pretestInactivityTimer: String(DEFAULT_NUMBERS.pretestInactivityTimer),
    pretestQuestionCount: String(DEFAULT_NUMBERS.pretestQuestionCount),
    pretestDefaultTimer: String(DEFAULT_NUMBERS.pretestDefaultTimer),
    pretestTimersPerLevel: buildEmptyPretestLevelTimers(),
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', confirmPin: '' });
  const [isPinSaving, setIsPinSaving] = useState(false);
  const [restoreForm, setRestoreForm] = useState({
    pin: '',
    add: '0',
    sub: '0',
    mul: '0',
    div: '0',
    grandTotalCorrect: '',
    currentStreak: '',
  });
  const [isRestoringUser, setIsRestoringUser] = useState(false);

  useEffect(() => {
    if (!status) return undefined;
    const timeoutId = window.setTimeout(() => {
      setStatus(null);
    }, TOAST_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [status]);

  const getStoredAdminPin = () => localStorage.getItem('math-admin-pin') || '';

  const loadConfig = useCallback(
    async ({ preserveStatus = false } = {}) => {
      const storedPin = getStoredAdminPin();
      if (storedPin && storedPin !== adminPin) {
        setAdminPin(storedPin);
      }
      if (!storedPin) return;
      if (!preserveStatus) setStatus(null);
      setIsLoading(true);
      try {
        const config = await getAppConfig(storedPin);
        const mapped = mapConfigToValues(config);
        setValues(mapped);
        setBaselineValues(mapped);
      } catch (e) {
        const message = e.message || 'Failed to load configuration.';
        setStatus({ type: 'error', message });
        if (/401|403|unauthorized/i.test(message)) {
          localStorage.removeItem('math-admin-pin');
          setAdminPin('');
          navigate('/name', { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [adminPin, navigate]
  );

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleChange = (key) => (e) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handlePretestLevelTimerChange = (level) => (e) => {
    const key = String(level);
    setValues((prev) => ({
      ...prev,
      pretestTimersPerLevel: {
        ...prev.pretestTimersPerLevel,
        [key]: e.target.value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const storedPin = getStoredAdminPin();
    if (storedPin && storedPin !== adminPin) {
      setAdminPin(storedPin);
    }
    if (!storedPin) return;
    setIsSaving(true);
    setStatus(null);
    try {
      const degreeChanges = [
        { key: 'blackDegree1', degree: 1 },
        { key: 'blackDegree2', degree: 2 },
        { key: 'blackDegree3', degree: 3 },
        { key: 'blackDegree4', degree: 4 },
        { key: 'blackDegree5', degree: 5 },
        { key: 'blackDegree6', degree: 6 },
        { key: 'blackDegree7', degree: 7 },
      ].filter(({ key }) => values[key] !== baselineValues[key]);

      const generalKeys = [
        'lightningTarget',
        'lightningTimer',
        'surfQuestionsPerQuiz',
        'surfQuizzesRequired',
        'rocketQuestionsPerQuiz',
        'rocketQuizzesRequired',
        'bonusTargetCorrect',
        'bonusVideoIntervalCorrect',
        'bonusQuestionsPerBatch',
        'inactivityTimer',
        'pretestInactivityTimer',
        'pretestQuestionCount',
      ];
      const hasGeneralChanges = generalKeys.some(
        (key) => values[key] !== baselineValues[key]
      );
      const hasPerLevelPretestTimerChanges = !isPretestLevelTimersEqual(
        values.pretestTimersPerLevel,
        baselineValues.pretestTimersPerLevel
      );

      if (hasGeneralChanges || hasPerLevelPretestTimerChanges) {
        const bonusTargetCorrect = toInt(
          values.bonusTargetCorrect,
          DEFAULT_NUMBERS.bonusTargetCorrect
        );
        const bonusVideoIntervalCorrect = toInt(
          values.bonusVideoIntervalCorrect,
          DEFAULT_NUMBERS.bonusVideoIntervalCorrect
        );
        if (
          bonusTargetCorrect < 1 ||
          bonusVideoIntervalCorrect < 1 ||
          bonusTargetCorrect % bonusVideoIntervalCorrect !== 0
        ) {
          setStatus({
            type: 'error',
            message:
              'Bonus target correct must be divisible by bonus video interval correct.',
          });
          setIsSaving(false);
          return;
        }

        const payload = buildConfigPayload(values);
        if (hasPerLevelPretestTimerChanges) {
          const pretestTimeLimitsPerLevelMs = {};
          for (let level = 1; level <= PRETEST_LEVEL_COUNT; level += 1) {
            const key = String(level);
            const nextRaw = String(values.pretestTimersPerLevel?.[key] ?? '').trim();
            const prevRaw = String(baselineValues.pretestTimersPerLevel?.[key] ?? '').trim();
            if (nextRaw === prevRaw) continue;

            if (nextRaw === '') {
              pretestTimeLimitsPerLevelMs[key] = 0;
              continue;
            }

            const nextSeconds = Number.parseInt(nextRaw, 10);
            if (!Number.isFinite(nextSeconds) || nextSeconds < 0) {
              setStatus({
                type: 'error',
                message: `Pretest timer for level ${level} must be 0 or greater.`,
              });
              setIsSaving(false);
              return;
            }
            pretestTimeLimitsPerLevelMs[key] = nextSeconds === 0 ? 0 : nextSeconds * 1000;
          }

          if (Object.keys(pretestTimeLimitsPerLevelMs).length > 0) {
            payload.pretestTimeLimitsPerLevelMs = pretestTimeLimitsPerLevelMs;
          }
        }
        await updateAppConfig(storedPin, payload);
      }

      if (degreeChanges.length > 0) {
        await Promise.all(
          degreeChanges.map(({ key, degree }) =>
            updateBlackBeltTimer(storedPin, degree, {
              timerMs: toInt(values[key], DEFAULT_NUMBERS[`blackDegree${degree}`]) * 1000,
            })
          )
        );
      }

      if (hasGeneralChanges || hasPerLevelPretestTimerChanges || degreeChanges.length > 0) {
        await reloadAppConfig(storedPin);
      }

      const refreshed = await getAppConfig(storedPin);
      const refreshedConfig = refreshed?.config || refreshed;
      let refreshedMapped = mapConfigToValues(refreshedConfig);

      const desiredDegreeTimers = [
        { key: 'blackDegree1', degree: 1 },
        { key: 'blackDegree2', degree: 2 },
        { key: 'blackDegree3', degree: 3 },
        { key: 'blackDegree4', degree: 4 },
        { key: 'blackDegree5', degree: 5 },
        { key: 'blackDegree6', degree: 6 },
        { key: 'blackDegree7', degree: 7 },
      ];
      const mismatchedDegrees = desiredDegreeTimers.filter(({ key, degree }) => {
        const desiredSeconds = toInt(values[key], DEFAULT_NUMBERS[`blackDegree${degree}`]);
        const backendSeconds = Number(refreshedConfig?.blackBeltTimers?.[`degree${degree}`]?.seconds);
        return Number.isFinite(backendSeconds) && backendSeconds !== desiredSeconds;
      });

      if (mismatchedDegrees.length > 0) {
        await Promise.all(
          mismatchedDegrees.map(({ key, degree }) =>
            updateBlackBeltTimer(storedPin, degree, {
              timerMs: toInt(values[key], DEFAULT_NUMBERS[`blackDegree${degree}`]) * 1000,
            })
          )
        );
        await reloadAppConfig(storedPin);
        const synced = await getAppConfig(storedPin);
        const syncedConfig = synced?.config || synced;
        refreshedMapped = mapConfigToValues(syncedConfig);
      }

      setValues(refreshedMapped);
      setBaselineValues(refreshedMapped);

      if (refreshedConfig?.lightningMode) {
        const targetCorrect = Number(refreshedConfig.lightningMode.targetCorrect);
        const fastThresholdMs = Number(refreshedConfig.lightningMode.fastThresholdMs);
        if (Number.isFinite(targetCorrect)) {
          localStorage.setItem('math-lightning-target', String(targetCorrect));
        }
        if (Number.isFinite(fastThresholdMs)) {
          localStorage.setItem('math-lightning-fast-ms', String(fastThresholdMs));
        }
      }
      if (refreshedConfig?.general) {
        const inactivityThresholdMs = Number(refreshedConfig.general.inactivityThresholdMs);
        if (Number.isFinite(inactivityThresholdMs)) {
          localStorage.setItem('math-inactivity-ms', String(inactivityThresholdMs));
        }
      }
      const pretestInactivityThresholdMs = Number(
        refreshedConfig?.pretestMode?.inactivityThresholdMs
      );
      if (Number.isFinite(pretestInactivityThresholdMs)) {
        localStorage.setItem('math-pretest-inactivity-ms', String(pretestInactivityThresholdMs));
      }

      if (hasGeneralChanges) {
        const savedQuestionsPerQuiz = Number(refreshedConfig?.surfMode?.questionsPerQuiz);
        if (
          Number.isFinite(savedQuestionsPerQuiz) &&
          savedQuestionsPerQuiz !==
            toInt(values.surfQuestionsPerQuiz, DEFAULT_NUMBERS.surfQuestionsPerQuiz)
        ) {
          setStatus({
            type: 'error',
            message: 'Save completed, but the backend did not persist the new surf quiz count.',
          });
          return;
        }

        const savedRocketQuestionsPerQuiz = Number(refreshedConfig?.rocketMode?.questionsPerQuiz);
        if (
          Number.isFinite(savedRocketQuestionsPerQuiz) &&
          savedRocketQuestionsPerQuiz !==
            toInt(values.rocketQuestionsPerQuiz, DEFAULT_NUMBERS.rocketQuestionsPerQuiz)
        ) {
          setStatus({
            type: 'error',
            message: 'Save completed, but the backend did not persist the new rocket quiz count.',
          });
          return;
        }

        const savedBonusTargetCorrect = Number(refreshedConfig?.bonusMode?.targetCorrect);
        if (
          Number.isFinite(savedBonusTargetCorrect) &&
          savedBonusTargetCorrect !==
            toInt(values.bonusTargetCorrect, DEFAULT_NUMBERS.bonusTargetCorrect)
        ) {
          setStatus({
            type: 'error',
            message: 'Save completed, but the backend did not persist the new bonus target.',
          });
          return;
        }

        const savedBonusVideoIntervalCorrect = Number(
          refreshedConfig?.bonusMode?.videoIntervalCorrect
        );
        if (
          Number.isFinite(savedBonusVideoIntervalCorrect) &&
          savedBonusVideoIntervalCorrect !==
            toInt(
              values.bonusVideoIntervalCorrect,
              DEFAULT_NUMBERS.bonusVideoIntervalCorrect
            )
        ) {
          setStatus({
            type: 'error',
            message:
              'Save completed, but the backend did not persist the new bonus video interval.',
          });
          return;
        }

        const savedBonusQuestionsPerBatch = Number(
          refreshedConfig?.bonusMode?.questionsPerBatch
        );
        if (
          Number.isFinite(savedBonusQuestionsPerBatch) &&
          savedBonusQuestionsPerBatch !==
            toInt(values.bonusQuestionsPerBatch, DEFAULT_NUMBERS.bonusQuestionsPerBatch)
        ) {
          setStatus({
            type: 'error',
            message:
              'Save completed, but the backend did not persist the new bonus questions per batch.',
          });
          return;
        }
      }

      setStatus({ type: 'success', message: 'Settings saved.' });
    } catch (e) {
      setStatus({ type: 'error', message: e.message || 'Failed to save settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const storedPin = getStoredAdminPin();
    if (storedPin && storedPin !== adminPin) {
      setAdminPin(storedPin);
    }
    if (!storedPin) return;
    setIsSaving(true);
    setStatus(null);
    try {
      await resetAppConfig(storedPin);
      await loadConfig({ preserveStatus: true });
      setStatus({ type: 'success', message: 'Settings reset to defaults.' });
    } catch (e) {
      setStatus({ type: 'error', message: e.message || 'Failed to reset settings.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReload = async () => {
    const storedPin = getStoredAdminPin();
    if (storedPin && storedPin !== adminPin) {
      setAdminPin(storedPin);
    }
    if (!storedPin) return;
    setIsSaving(true);
    setStatus(null);
    try {
      await reloadAppConfig(storedPin);
      await loadConfig({ preserveStatus: true });
      setStatus({ type: 'success', message: 'Configuration reloaded.' });
    } catch (e) {
      setStatus({ type: 'error', message: e.message || 'Failed to reload configuration.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePinFieldChange = (key) => (e) => {
    setPinForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleRestoreFieldChange = (key) => (e) => {
    setRestoreForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleRestoreUserSubmit = async () => {
    const storedPin = getStoredAdminPin();
    if (storedPin && storedPin !== adminPin) {
      setAdminPin(storedPin);
    }
    if (!storedPin) return;

    const targetPin = restoreForm.pin.trim();
    if (!targetPin) {
      setStatus({ type: 'error', message: 'User PIN is required for restore.' });
      return;
    }

    const operations = {};
    for (const op of RESTORE_OPERATION_KEYS) {
      const raw = String(restoreForm[op] ?? '').trim();
      const parsed = raw === '' ? 0 : Number.parseInt(raw, 10);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setStatus({
          type: 'error',
          message: `Operation level count for "${op}" must be 0 or greater.`,
        });
        return;
      }
      operations[op] = parsed;
    }

    const payload = {
      pin: targetPin,
      operations,
    };

    const grandTotalRaw = String(restoreForm.grandTotalCorrect ?? '').trim();
    if (grandTotalRaw !== '') {
      const grandTotalCorrect = Number.parseInt(grandTotalRaw, 10);
      if (!Number.isFinite(grandTotalCorrect) || grandTotalCorrect < 0) {
        setStatus({
          type: 'error',
          message: 'Grand total correct must be 0 or greater.',
        });
        return;
      }
      payload.grandTotalCorrect = grandTotalCorrect;
    }

    const streakRaw = String(restoreForm.currentStreak ?? '').trim();
    if (streakRaw !== '') {
      const currentStreak = Number.parseInt(streakRaw, 10);
      if (!Number.isFinite(currentStreak) || currentStreak < 0) {
        setStatus({
          type: 'error',
          message: 'Current streak must be 0 or greater.',
        });
        return;
      }
      payload.currentStreak = currentStreak;
    }

    setIsRestoringUser(true);
    setStatus(null);
    try {
      const out = await restoreUserProgress(storedPin, payload);
      const restoredUserName = out?.user ? ` (${out.user})` : '';
      setStatus({
        type: 'success',
        message: out?.message
          ? `${out.message}${restoredUserName}`
          : `User progress restored${restoredUserName}.`,
      });
    } catch (e) {
      setStatus({ type: 'error', message: e.message || 'Failed to restore user progress.' });
    } finally {
      setIsRestoringUser(false);
    }
  };

  const handleAdminPinSubmit = async (e) => {
    e.preventDefault();
    const storedPin = getStoredAdminPin();
    if (storedPin && storedPin !== adminPin) {
      setAdminPin(storedPin);
    }
    if (!storedPin) return;
    const currentPin = pinForm.currentPin.trim();
    const nextPin = pinForm.newPin.trim();
    const confirmPin = pinForm.confirmPin.trim();

    if (!/^\d{4}$/.test(currentPin)) {
      setStatus({ type: 'error', message: 'Current admin PIN must be exactly 4 digits.' });
      return;
    }
    if (!/^\d{4}$/.test(nextPin)) {
      setStatus({ type: 'error', message: 'Admin PIN must be exactly 4 digits.' });
      return;
    }
    if (nextPin !== confirmPin) {
      setStatus({ type: 'error', message: 'Admin PIN entries do not match.' });
      return;
    }

    setIsPinSaving(true);
    setStatus(null);
    try {
      await updateAdminPin(currentPin, currentPin, nextPin);
      await reloadAppConfig(nextPin);
      localStorage.setItem('math-admin-pin', nextPin);
      setAdminPin(nextPin);
      setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
      setStatus({ type: 'success', message: 'Admin PIN updated.' });
    } catch (e) {
      setStatus({ type: 'error', message: e.message || 'Failed to update admin PIN.' });
    } finally {
      setIsPinSaving(false);
    }
  };

  const inputClass =
    'h-9 w-full rounded-lg border border-[#506ba3] bg-[linear-gradient(180deg,rgba(8,22,60,0.98),rgba(12,30,77,0.86))] px-3 text-center text-[0.95rem] font-semibold tracking-[0.01em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition focus:border-[#62d9ff]/70 focus:outline-none focus:ring-2 focus:ring-[#39b6ff]/20 disabled:cursor-not-allowed disabled:opacity-60';
  const wideInputClass =
    'h-9 w-full rounded-lg border border-[#506ba3] bg-[linear-gradient(180deg,rgba(8,22,60,0.98),rgba(12,30,77,0.86))] px-3 text-left text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition focus:border-[#62d9ff]/70 focus:outline-none focus:ring-2 focus:ring-[#39b6ff]/20 disabled:cursor-not-allowed disabled:opacity-60';
  const isBusy = isLoading || isSaving || isRestoringUser;

  return (
    <div className="relative overflow-hidden px-3 py-3 sm:px-5 lg:px-6" style={dashboardStyle}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: "url('/night_sky_landscape.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(110,170,255,0.08),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(29,203,255,0.12),transparent_32%)]" />

      <div className="relative z-10 mx-auto max-w-[1540px]">
      {status && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md pointer-events-none">
          <div
            className={`w-full rounded-2xl px-4 py-3 text-sm shadow-2xl backdrop-blur-xl border ${
              status.type === 'error'
                ? 'bg-[#3a1f24]/95 text-[#ffe3e7] border-[#ff7a8a]/45'
                : 'bg-[#153a34]/95 text-[#dffcf3] border-[#3dd6ac]/45'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="pt-0.5">
                {status.type === 'error' ? (
                  <FaExclamationCircle className="text-[#ff8c99]" size={16} />
                ) : (
                  <FaCheckCircle className="text-[#5ce2be]" size={16} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-5">
                  {status.type === 'error' ? 'Action failed' : 'Success'}
                </p>
                <p className="mt-0.5 text-[13px] leading-5 opacity-95 break-words">
                  {status.message}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 flex items-center justify-between gap-4 sm:mb-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <button
            onClick={() => navigate('/admin-dashboard')}
            className="group inline-flex h-14 items-center gap-3 rounded-full border border-[#7db7ff]/28 bg-[linear-gradient(180deg,rgba(12,31,74,0.92),rgba(8,21,55,0.96))] pl-2 pr-4 text-white shadow-[0_14px_30px_rgba(0,9,30,0.32),inset_0_1px_0_rgba(220,239,255,0.08)] transition hover:-translate-y-0.5 hover:border-[#98ceff]/38 hover:shadow-[0_18px_36px_rgba(0,9,30,0.38),0_0_18px_rgba(93,183,255,0.15)]"
            aria-label="Back to admin dashboard"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[radial-gradient(circle_at_top_left,_rgba(121,198,255,0.22),_rgba(18,45,108,0.98)_70%)] text-[#eaf4ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition group-hover:scale-105">
              <FaArrowLeft size={18} className="block" />
            </span>
            <span className="hidden text-sm font-bold tracking-[0.01em] text-[#d7ebff] sm:block">
              Back
            </span>
          </button>
          <div className="min-w-0">
            <h1 className="text-white text-3xl font-extrabold leading-[0.95] tracking-[0.01em] drop-shadow sm:text-[3.3rem]">
              App Configuration
            </h1>
            <p className="mt-1.5 max-w-3xl text-sm leading-[1.3] text-[#a7bedf] sm:text-lg">
              Manage game settings, timers, and learning progress.
            </p>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="mb-5 inline-flex items-center gap-3 rounded-full border border-[#5bc2ff]/30 bg-[rgba(10,28,70,0.72)] px-4 py-2 text-sm font-semibold text-[#d4ecff] shadow-[0_10px_26px_rgba(0,8,26,0.28)] backdrop-blur-xl">
          <span className="h-2.5 w-2.5 rounded-full bg-[#62d9ff] shadow-[0_0_14px_rgba(98,217,255,0.8)] animate-pulse" />
          Loading configuration...
        </div>
      )}

      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
        <SectionCard
          icon={FaClock}
          iconClass="border-[#3e8fff]/40 text-[#59bfff]"
          title="Black Belt Timers"
        >
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {[
              ['Degree 1', 'blackDegree1'],
              ['Degree 2', 'blackDegree2'],
              ['Degree 3', 'blackDegree3'],
              ['Degree 4', 'blackDegree4'],
              ['Degree 5', 'blackDegree5'],
              ['Degree 6', 'blackDegree6'],
              ['Degree 7', 'blackDegree7'],
            ].map(([label, key]) => (
              <SettingField
                key={key}
                label={label}
                icon={FaStar}
                iconClass="text-[#3d90ff]"
              >
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={values[key]}
                  onChange={handleChange(key)}
                  disabled={isBusy}
                />
              </SettingField>
            ))}
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SectionCard
            icon={FaBolt}
            iconClass="border-[#4898ff]/40 text-[#73b7ff]"
            title="Lightning"
          >
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <SettingField
                label="Target correct"
                icon={FaBullseye}
                iconClass="text-[#ffea59]"
              >
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={values.lightningTarget}
                  onChange={handleChange('lightningTarget')}
                  disabled={isBusy}
                />
              </SettingField>
              <SettingField
                label="Timer (sec)"
                icon={FaStopwatch}
                iconClass="text-[#b8ff40]"
              >
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={values.lightningTimer}
                  onChange={handleChange('lightningTimer')}
                  disabled={isBusy}
                />
              </SettingField>
            </div>
          </SectionCard>

          <SectionCard
            icon={FaTrophy}
            iconClass="border-[#43d8d2]/38 text-[#52ece4]"
            title="Surfboard"
          >
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <SettingField
                label="Questions per quiz"
                icon={FaQuestionCircle}
                iconClass="text-[#55f0ff]"
              >
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={values.surfQuestionsPerQuiz}
                  onChange={handleChange('surfQuestionsPerQuiz')}
                  disabled={isBusy}
                />
              </SettingField>
              <SettingField
                label="Number of quizzes"
                icon={FaTrophy}
                iconClass="text-[#3be1ff]"
              >
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={values.surfQuizzesRequired}
                  onChange={handleChange('surfQuizzesRequired')}
                  disabled={isBusy}
                />
              </SettingField>
            </div>
          </SectionCard>

          <SectionCard
            icon={FaRocket}
            iconClass="border-[#9355ff]/38 text-[#c271ff]"
            title="Rocket"
          >
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <SettingField
                label="Questions per quiz"
                icon={FaQuestionCircle}
                iconClass="text-[#c271ff]"
              >
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={values.rocketQuestionsPerQuiz}
                  onChange={handleChange('rocketQuestionsPerQuiz')}
                  disabled={isBusy}
                />
              </SettingField>
              <SettingField
                label="Number of quizzes"
                icon={FaRocket}
                iconClass="text-[#d68aff]"
              >
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={values.rocketQuizzesRequired}
                  onChange={handleChange('rocketQuizzesRequired')}
                  disabled={isBusy}
                />
              </SettingField>
            </div>
          </SectionCard>

          <SectionCard
            icon={FaStopwatch}
            iconClass="border-[#59a7ff]/40 text-[#87c0ff]"
            title="Global"
          >
            <div className="grid grid-cols-1 gap-2.5">
              <SettingField
                label="Inactivity timer (sec)"
                icon={FaClock}
                iconClass="text-[#7dd3fc]"
              >
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={values.inactivityTimer}
                  onChange={handleChange('inactivityTimer')}
                  disabled={isBusy}
                />
              </SettingField>
            </div>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <SectionCard
            icon={FaStar}
            iconClass="border-[#4ca8ff]/38 text-[#7dd3fc]"
            title="Bonus"
          >
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              <SettingField
                label="Target correct"
                icon={FaBullseye}
                iconClass="text-[#ffd166]"
              >
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={values.bonusTargetCorrect}
                  onChange={handleChange('bonusTargetCorrect')}
                  disabled={isBusy}
                />
              </SettingField>
              <SettingField
                label="Video interval"
                icon={FaStar}
                iconClass="text-[#8fe3ff]"
              >
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={values.bonusVideoIntervalCorrect}
                  onChange={handleChange('bonusVideoIntervalCorrect')}
                  disabled={isBusy}
                />
              </SettingField>
              <SettingField
                label="Questions per batch"
                icon={FaQuestionCircle}
                iconClass="text-[#75d5ff]"
              >
                <input
                  type="number"
                  min="1"
                  className={inputClass}
                  value={values.bonusQuestionsPerBatch}
                  onChange={handleChange('bonusQuestionsPerBatch')}
                  disabled={isBusy}
                />
              </SettingField>
            </div>
          </SectionCard>

          <SectionCard
            icon={FaShieldAlt}
            iconClass="border-[#59a7ff]/40 text-[#8ec9ff]"
            title="Admin PIN"
            headerAction={
              <button
                type="button"
                onClick={handleAdminPinSubmit}
                className="inline-flex min-h-[2.9rem] items-center justify-center rounded-[0.95rem] border border-[#68aeff]/35 bg-[linear-gradient(135deg,#2d74ff_0%,#1747c8_55%,#0f2a75_100%)] px-4 py-2.5 text-sm font-extrabold tracking-[0.01em] text-white shadow-[0_14px_26px_rgba(7,20,71,0.34),0_0_14px_rgba(44,108,255,0.2)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60"
                disabled={isBusy || isPinSaving}
              >
                {isPinSaving ? 'Updating...' : 'Update PIN'}
              </button>
            }
          >
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              <SettingField
                label="Current PIN"
                icon={FaKey}
                iconClass="text-[#8ec9ff]"
              >
                <input
                  type="password"
                  className={inputClass}
                  value={pinForm.currentPin}
                  onChange={handlePinFieldChange('currentPin')}
                  disabled={isBusy || isPinSaving}
                  maxLength={4}
                  inputMode="numeric"
                />
              </SettingField>
              <SettingField
                label="New PIN"
                icon={FaKey}
                iconClass="text-[#61d1ff]"
              >
                <input
                  type="password"
                  className={inputClass}
                  value={pinForm.newPin}
                  onChange={handlePinFieldChange('newPin')}
                  disabled={isBusy || isPinSaving}
                  maxLength={4}
                  inputMode="numeric"
                />
              </SettingField>
              <SettingField
                label="Confirm PIN"
                icon={FaShieldAlt}
                iconClass="text-[#78a9ff]"
              >
                <input
                  type="password"
                  className={inputClass}
                  value={pinForm.confirmPin}
                  onChange={handlePinFieldChange('confirmPin')}
                  disabled={isBusy || isPinSaving}
                  maxLength={4}
                  inputMode="numeric"
                />
              </SettingField>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          icon={FaQuestionCircle}
          iconClass="border-[#59a7ff]/40 text-[#86beff]"
          title="Pretest"
        >
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <SettingField
              label="Questions"
              icon={FaQuestionCircle}
              iconClass="text-[#79c7ff]"
              className="lg:flex-row lg:items-center lg:justify-between lg:gap-4"
              contentClassName="lg:w-[11rem] lg:flex-none"
            >
              <input
                type="number"
                min="1"
                className={inputClass}
                value={values.pretestQuestionCount}
                onChange={handleChange('pretestQuestionCount')}
                disabled={isBusy}
              />
            </SettingField>
            <SettingField
              label="Inactivity timer (sec)"
              icon={FaStopwatch}
              iconClass="text-[#88d6ff]"
              className="lg:flex-row lg:items-center lg:justify-between lg:gap-4"
              contentClassName="lg:w-[11rem] lg:flex-none"
            >
              <input
                type="number"
                min="0"
                className={inputClass}
                value={values.pretestInactivityTimer}
                onChange={handleChange('pretestInactivityTimer')}
                disabled={isBusy}
              />
            </SettingField>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-[#8fb1dc]">
              <FaClock className="text-[#5fd5ff]" />
              Per-Level Timer
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))] gap-2.5">
              {Array.from({ length: PRETEST_LEVEL_COUNT }, (_, idx) => idx + 1).map((level) => (
                <SettingField
                  key={`pretest-level-${level}`}
                  label={`Level ${level}`}
                  icon={FaStar}
                  iconClass="text-[#4ba2ff]"
                >
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={values.pretestTimersPerLevel[String(level)]}
                    onChange={handlePretestLevelTimerChange(level)}
                    placeholder={values.pretestDefaultTimer}
                    autoComplete="off"
                    name={`pretest-level-${level}-timer`}
                    disabled={isBusy}
                  />
                </SettingField>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={FaUndoAlt}
          iconClass="border-[#59a7ff]/40 text-[#8ec9ff]"
          title="Restore User Progress"
          headerAction={
            <button
              type="button"
              onClick={handleRestoreUserSubmit}
              className="inline-flex min-h-[2.9rem] items-center justify-center rounded-[0.95rem] border border-[#68aeff]/35 bg-[linear-gradient(135deg,#2d74ff_0%,#1747c8_55%,#0f2a75_100%)] px-4 py-2.5 text-sm font-extrabold tracking-[0.01em] text-white shadow-[0_14px_26px_rgba(7,20,71,0.34),0_0_14px_rgba(44,108,255,0.2)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-60"
              disabled={isBusy}
            >
              {isRestoringUser ? 'Restoring...' : 'Restore User'}
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <SettingField
              label="User PIN"
              icon={FaKey}
              iconClass="text-[#8ec9ff]"
            >
              <input
                type="text"
                className={wideInputClass}
                value={restoreForm.pin}
                onChange={handleRestoreFieldChange('pin')}
                disabled={isBusy}
                autoComplete="off"
                inputMode="numeric"
              />
            </SettingField>
              {RESTORE_OPERATION_KEYS.map((op) => (
                <SettingField
                  key={`restore-op-${op}`}
                  label={`${op.toUpperCase()} levels`}
                  icon={FaStar}
                  iconClass="text-[#4ba2ff]"
                >
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={restoreForm[op]}
                    onChange={handleRestoreFieldChange(op)}
                    disabled={isBusy}
                  />
                </SettingField>
              ))}
              <SettingField
                label="Grand total correct"
                icon={FaTrophy}
                iconClass="text-[#5cd6ff]"
              >
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={restoreForm.grandTotalCorrect}
                  onChange={handleRestoreFieldChange('grandTotalCorrect')}
                  disabled={isBusy}
                />
              </SettingField>
              <SettingField
                label="Current streak"
                icon={FaBolt}
                iconClass="text-[#8ddbff]"
              >
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={restoreForm.currentStreak}
                  onChange={handleRestoreFieldChange('currentStreak')}
                  disabled={isBusy}
                />
              </SettingField>
          </div>
        </SectionCard>

        <div className="sticky bottom-3 z-20">
          <div className="rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(6,18,52,0.88),rgba(7,19,48,0.76))] p-3 shadow-[0_22px_50px_rgba(0,8,24,0.48),inset_0_1px_0_rgba(219,239,255,0.05)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleReset}
                className="group inline-flex min-h-[5rem] items-center gap-3 rounded-[1.2rem] border border-[#ffb655]/45 bg-[linear-gradient(135deg,rgba(59,39,17,0.9),rgba(112,67,7,0.86))] px-5 py-4 text-left text-white shadow-[0_16px_32px_rgba(33,18,4,0.34)] transition hover:-translate-y-0.5 disabled:opacity-60"
                disabled={isBusy}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ffcb86]/35 bg-[rgba(255,170,57,0.14)] text-[#ffb640]">
                  <FaUndoAlt />
                </span>
                <span>
                  <span className="block text-base font-extrabold">Reset Defaults</span>
                </span>
              </button>
              <button
                type="button"
                onClick={handleReload}
                className="group inline-flex min-h-[5rem] items-center gap-3 rounded-[1.2rem] border border-[#985fff]/42 bg-[linear-gradient(135deg,rgba(34,19,74,0.92),rgba(74,40,160,0.84))] px-5 py-4 text-left text-white shadow-[0_16px_32px_rgba(18,10,48,0.34)] transition hover:-translate-y-0.5 disabled:opacity-60"
                disabled={isBusy}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#c39dff]/35 bg-[rgba(156,104,255,0.16)] text-[#a46cff]">
                  <FaSyncAlt />
                </span>
                <span>
                  <span className="block text-base font-extrabold">Reload Config</span>
                </span>
              </button>
              </div>
              <button
                type="submit"
                className="group inline-flex min-h-[5rem] items-center gap-3 rounded-[1.2rem] border border-[#63ffca]/34 bg-[linear-gradient(135deg,rgba(8,117,100,0.92),rgba(23,177,130,0.88))] px-5 py-4 text-left text-white shadow-[0_18px_34px_rgba(5,76,58,0.34),0_0_24px_rgba(80,255,193,0.12)] transition hover:-translate-y-0.5 disabled:opacity-60"
                disabled={isBusy}
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-[rgba(255,255,255,0.1)] text-white">
                  <FaSave />
                </span>
                <span>
                  <span className="block text-base font-extrabold">
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </form>
      </div>
    </div>
  );
};

export default AdminSettings;
