import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";

import {
  FaArrowLeft,
  FaExclamationTriangle,
  FaBullseye,
  FaCheckCircle,
  FaChartLine,
  FaLayerGroup,
} from "react-icons/fa";
import {
  analyticsGetSummary,
  analyticsGetFacts,
  analyticsGetFactDetail,
  analyticsGetStruggling,
  getAdminStats,
  userGetProgress,
} from "../api/mathApi.js";
import { MODULE_META, getOperationMaxLevel, normalizeOperation } from "../config/modulesConfig.js";

const OPS = [
  { value: "all", label: "All operations" },
  { value: "add", label: "Addition" },
  { value: "sub", label: "Subtraction" },
  { value: "mul", label: "Multiplication" },
  { value: "div", label: "Division" },
];

const FACTS_PAGE_SIZE = 50;
const FACT_SORT = {
  ACCURACY: "accuracy",
  ATTEMPTS: "attempts",
  AVG: "avg",
};
const PROGRESS_OPERATION_ORDER = ["add", "sub", "mul", "div"];
const ATTEMPT_TIME_ZONE = "America/Los_Angeles";
const ATTEMPT_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: ATTEMPT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZoneName: "short",
});

const toSafeStudentText = (value, fallback = "N/A") => {
  const safe = String(value ?? "").trim();
  return safe.length ? safe : fallback;
};

const getAvatarInitials = (name) => {
  const safe = toSafeStudentText(name, "S");
  const parts = safe
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  const initials = parts.map((part) => part[0]?.toUpperCase() || "").join("");
  return initials || "S";
};

const getAvatarGradient = (name) => {
  const source = String(name || "student");
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) % 360;
  }
  const hueA = hash;
  const hueB = (hash + 48) % 360;
  const hueC = (hash + 96) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hueA} 90% 58%), hsl(${hueB} 85% 52%), hsl(${hueC} 88% 50%))`,
  };
};

const getBeltLabel = (levelData = {}) => {
  const beltsOrder = ["white", "yellow", "green", "blue", "red", "brown"];
  let currentBelt = "White";

  if (levelData.black?.unlocked) {
    const completedDegrees = Array.isArray(levelData.black?.completedDegrees)
      ? levelData.black.completedDegrees
      : [];
    const currentDegree = Math.min(completedDegrees.length + 1, 7);
    currentBelt = `Black Degree ${currentDegree}`;
  } else {
    for (const belt of beltsOrder) {
      if (levelData[belt] && (levelData[belt].unlocked || levelData[belt].completed)) {
        currentBelt = belt.charAt(0).toUpperCase() + belt.slice(1);
      }
    }
  }

  if (levelData.completed && !levelData.black?.unlocked) {
    return "Level Mastered";
  }
  return currentBelt;
};

const parseLevelsFromNode = (node = {}) =>
  Object.keys(node)
    .filter((k) => k.startsWith("L"))
    .map((k) => ({ key: k, level: parseInt(k.substring(1), 10), data: node[k] }))
    .filter((x) => Number.isFinite(x.level))
    .sort((a, b) => a.level - b.level);

const hasFlatLevelKeys = (node) =>
  !!node &&
  typeof node === "object" &&
  Object.keys(node).some((key) => /^L\d+$/i.test(key));

const pickCurrentLevelFromLevels = (levelsAsc = []) => {
  if (!levelsAsc.length) return null;

  const unlockedLevels = levelsAsc.filter((l) => !!l.data?.unlocked);
  const highestUnlockedIncomplete = [...unlockedLevels]
    .reverse()
    .find((l) => !l.data?.completed);

  return highestUnlockedIncomplete || unlockedLevels[unlockedLevels.length - 1] || levelsAsc[0];
};

const getCurrentProgress = (progress) => {
  if (!progress) return { level: "N/A", belt: "N/A" };

  const hasScopedOps = PROGRESS_OPERATION_ORDER.some(
    (op) => progress?.[op] && typeof progress[op] === "object"
  );

  if (!hasScopedOps && hasFlatLevelKeys(progress)) {
    const flatLevels = parseLevelsFromNode(progress);
    if (flatLevels.length > 0) {
      const currentLevelInfo = pickCurrentLevelFromLevels(flatLevels);
      if (!currentLevelInfo) return { level: "N/A", belt: "N/A" };
      return {
        level: `L${currentLevelInfo.level}`,
        belt: getBeltLabel(currentLevelInfo.data),
      };
    }
  }

  const opSnapshots = PROGRESS_OPERATION_ORDER.map((operationName) => {
    const levels = parseLevelsFromNode(progress?.[operationName] || {});
    if (!levels.length) return null;
    const current = pickCurrentLevelFromLevels(levels);
    if (!current || !current.data?.unlocked) return null;
    return { operationName, current };
  }).filter(Boolean);

  if (!opSnapshots.length) return { level: "N/A", belt: "N/A" };

  const highestUnlockedIncompleteOp = [...opSnapshots]
    .reverse()
    .find((entry) => !entry.current.data?.completed);
  const active = highestUnlockedIncompleteOp || opSnapshots[opSnapshots.length - 1];
  const opLabel = active.operationName.toUpperCase();

  return {
    level: `${opLabel} L${active.current.level}`,
    belt: getBeltLabel(active.current.data),
  };
};

const findStudentFromAdminStats = async (adminPin, targetPin) => {
  const wantedPin = String(targetPin ?? "").trim();
  if (!adminPin || !wantedPin) return null;

  const pageSize = 100;
  let offset = 0;
  let safetyCounter = 0;

  while (safetyCounter < 100) {
    const response = await getAdminStats(adminPin, pageSize, offset);
    const rows = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : [];

    const found = rows.find((row) => String(row?.pin ?? "").trim() === wantedPin);
    if (found) return found;

    const hasMoreFromHeader =
      typeof response?.pagination?.hasMore === "boolean"
        ? response.pagination.hasMore
        : null;
    const hasMore = hasMoreFromHeader ?? rows.length >= pageSize;
    if (!hasMore) return null;

    offset += pageSize;
    safetyCounter += 1;
  }

  return null;
};

function pct(x) {
  if (x == null || Number.isNaN(x)) return "--";
  return `${Math.round(x * 100)}%`;
}
function ms(x) {
  if (x == null || Number.isNaN(x)) return "--";
  if (x < 1000) return `${Math.round(x)}ms`;
  return `${(x / 1000).toFixed(1)}s`;
}

const formatAttemptDateTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return ATTEMPT_DATE_TIME_FORMATTER.format(date);
};

const MAX_ANALYTICS_LEVEL = 19;

const getAnalyticsOperationMaxLevel = (operation) => {
  if (operation === "all") return MAX_ANALYTICS_LEVEL;
  const normalized = normalizeOperation(operation);
  const operationMeta = MODULE_META[normalized];
  if (!operationMeta?.enabled) return 0;
  const configuredMax = Number(getOperationMaxLevel(normalized, 0));
  return Number.isFinite(configuredMax) && configuredMax > 0 ? configuredMax : 0;
};

const FactDetailModal = ({ open, onClose, pin, factKey, onDetailLoaded }) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!open || !factKey) return;
      setLoading(true);
      setError("");

      try {
        const data = await analyticsGetFactDetail(pin, {
          operation: factKey.operation,
          a: factKey.a,
          b: factKey.b,
          limit: 200,
        });
        if (alive) {
          setDetail(data);
          onDetailLoaded?.(data, factKey);
        }
      } catch (e) {
        if (alive) setError(e?.message || "Failed to load fact details");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [open, pin, factKey]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#020617]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] rounded-[28px] border border-cyan-300/35 bg-[radial-gradient(circle_at_18%_0%,rgba(45,74,163,0.35),rgba(8,18,54,0.95)_44%),linear-gradient(150deg,rgba(7,15,45,0.95),rgba(3,9,31,0.98))] text-slate-100 shadow-[0_0_0_1px_rgba(125,211,252,0.08),0_20px_65px_rgba(2,6,23,0.88),0_0_55px_rgba(56,189,248,0.18)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-4 sm:px-6 py-4 border-b border-cyan-200/20 bg-slate-950/35">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-[76px] sm:w-[96px]" aria-hidden="true" />
            <div className="flex-1 text-center text-2xl sm:text-4xl font-black tracking-tight text-slate-50">
            {detail?.fact?.question || "Fact details"}
            </div>
            <button
              className="w-[76px] sm:w-[96px] rounded-xl px-3 py-2 bg-gradient-to-b from-blue-500/45 to-blue-700/35 border border-cyan-300/45 text-slate-100 font-bold hover:from-blue-400/55 hover:to-blue-600/45 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
          {loading && <div className="text-cyan-100/85">Loading...</div>}
          {error && <div className="text-red-300">{error}</div>}

          {detail && !loading && !error && (
            <>
              <div className="rounded-2xl border border-cyan-200/20 bg-slate-950/30 p-3 sm:p-4 mb-5 sm:mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                {[
                  { label: "Attempts", value: detail.stats?.totalAttempts ?? 0 },
                  { label: "Accuracy", value: pct(detail.stats?.accuracy ?? 0) },
                  { label: "Avg time", value: ms(detail.stats?.avgMs) },
                  { label: "Median time", value: ms(detail.stats?.medianMs) },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-cyan-200/20 bg-[linear-gradient(140deg,rgba(21,34,72,0.85),rgba(16,31,67,0.68),rgba(36,130,174,0.18))] p-3.5 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(2,6,23,0.45)]"
                  >
                    <div className="text-xs sm:text-sm text-cyan-100/80 font-medium tracking-wide">
                      {s.label}
                    </div>
                    <div className="text-2xl sm:text-4xl font-black text-slate-50 leading-tight mt-1">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
              </div>

              <div className="font-bold text-xl sm:text-4xl text-slate-50 mb-3 sm:mb-4">
                Recent attempts
              </div>

              {detail.recentAttempts?.length === 0 && (
                <div className="rounded-xl border border-cyan-200/20 bg-slate-900/45 p-4 text-cyan-100/75">
                  No attempts recorded yet.
                </div>
              )}

              <div className="space-y-3 sm:space-y-4 pb-4">
                {detail.recentAttempts?.map((a, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-cyan-300/30 bg-[linear-gradient(135deg,rgba(16,28,63,0.82),rgba(11,33,68,0.68),rgba(11,23,55,0.9))] shadow-[0_12px_30px_rgba(2,6,23,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-lg sm:text-[1.9rem] leading-snug text-slate-50">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 mr-2 rounded-md text-sm ${
                            a.correct
                              ? "bg-emerald-400/80 text-slate-900"
                              : "bg-amber-300/85 text-slate-900"
                          }`}
                        >
                          {a.correct ? "✓" : "!"}
                        </span>
                        {a.correct ? "Correct" : "Timed Out"} · answered{" "}
                        <span className="font-mono">{a.userAnswer}</span>{" "}
                        <span className="text-cyan-100/85">(correct {a.correctAnswer})</span>
                      </div>
                      <div className="shrink-0 rounded-xl border border-cyan-200/35 bg-[linear-gradient(140deg,rgba(59,130,246,0.22),rgba(15,23,42,0.72))] px-3 py-1.5 text-lg sm:text-2xl font-black text-cyan-100 shadow-[0_8px_18px_rgba(15,23,42,0.45)]">
                        {ms(a.responseMs)}
                      </div>
                    </div>

                    <div className="text-xs sm:text-base text-cyan-100/78">
                      {formatAttemptDateTime(a.attemptedAt)} ·
                      {" "}
                      {a.gameMode ? "Game mode" : "Quiz"}
                    </div>

                    {Array.isArray(a.choices) && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm sm:text-lg text-cyan-100/85">
                          Choices:
                        </span>
                        {a.choices.map((choice, choiceIdx) => (
                          <span
                            key={`${idx}-${choiceIdx}-${choice}`}
                            className="min-w-[2.25rem] text-center rounded-lg border border-cyan-200/45 bg-[linear-gradient(145deg,rgba(56,189,248,0.3),rgba(15,23,42,0.82))] px-3 py-1 text-sm sm:text-2xl font-bold font-mono text-slate-50 shadow-[0_6px_14px_rgba(15,23,42,0.4)]"
                          >
                            {choice}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


export default function AnalyticsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pin: routePin } = useParams();

  const pin = useMemo(() => {
    return routePin || localStorage.getItem("math-child-pin") || "";
  }, [routePin]);

  const [summary, setSummary] = useState(null);
  const [struggling, setStruggling] = useState(null);
  const [studentInfo, setStudentInfo] = useState(() => ({
    name: toSafeStudentText(location.state?.studentName, "Loading..."),
    level: toSafeStudentText(location.state?.studentLevel, "Loading..."),
    belt: toSafeStudentText(location.state?.studentBelt, "Loading..."),
    pin: toSafeStudentText(routePin || location.state?.studentPin, "N/A"),
  }));

  const [level, setLevel] = useState("all");
  const [operation, setOperation] = useState("all");

  const [facts, setFacts] = useState([]);
  const [factsSort, setFactsSort] = useState(FACT_SORT.ACCURACY);
  const [pagination, setPagination] = useState({
    limit: FACTS_PAGE_SIZE,
    nextOffset: 0,
    total: 0,
    hasMore: false,
  });

  const [loadingTop, setLoadingTop] = useState(true);
  const [loadingFacts, setLoadingFacts] = useState(true);
  const [loadingMoreFacts, setLoadingMoreFacts] = useState(false);
  const [error, setError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailFact, setDetailFact] = useState(null);
  const [lastFactDetail, setLastFactDetail] = useState(null);
  const [lastFactKey, setLastFactKey] = useState(null);
  const loadMoreRef = useRef(null);
  const factsRequestSeqRef = useRef(0);
  const availableLevels = useMemo(() => {
    const maxLevel = getAnalyticsOperationMaxLevel(operation);
    return [{ value: "all", label: "All levels" }].concat(
      Array.from({ length: maxLevel }, (_, i) => ({
        value: String(i + 1),
        label: `Level ${i + 1}`,
      }))
    );
  }, [operation]);

  useEffect(() => {
    if (level === "all") return;
    const numericLevel = Number(level);
    const maxLevel = getAnalyticsOperationMaxLevel(operation);
    if (!Number.isFinite(numericLevel) || numericLevel < 1 || numericLevel > maxLevel) {
      setLevel("all");
    }
  }, [level, operation]);

  const sortedFacts = useMemo(() => {
    if (!Array.isArray(facts)) return [];
    const avgDisplayBucketMs = (rawAvg) => {
      const avg = Number(rawAvg ?? 0);
      if (!Number.isFinite(avg)) return 0;
      // Match display precision while keeping one unit (milliseconds) for sorting.
      // <1000ms is displayed as integer ms, >=1000ms is displayed as 0.1s (100ms steps).
      return avg < 1000 ? Math.round(avg) : Math.round(avg / 100) * 100;
    };

    return [...facts].sort((a, b) => {
      const accA = Number(a?.stats?.accuracy ?? 0);
      const accB = Number(b?.stats?.accuracy ?? 0);
      const attemptsA = Number(a?.stats?.totalAttempts ?? 0);
      const attemptsB = Number(b?.stats?.totalAttempts ?? 0);
      const avgA = Number(a?.stats?.avgMs ?? 0);
      const avgB = Number(b?.stats?.avgMs ?? 0);
      const avgBucketA = avgDisplayBucketMs(avgA);
      const avgBucketB = avgDisplayBucketMs(avgB);

      if (factsSort === FACT_SORT.ATTEMPTS) {
        if (attemptsB !== attemptsA) return attemptsB - attemptsA;
        if (accB !== accA) return accB - accA;
        return avgB - avgA;
      }

      if (factsSort === FACT_SORT.AVG) {
        if (avgBucketB !== avgBucketA) return avgBucketB - avgBucketA;
        if (attemptsB !== attemptsA) return attemptsB - attemptsA;
        return accB - accA;
      }

      if (accB !== accA) return accB - accA;
      if (attemptsB !== attemptsA) return attemptsB - attemptsA;
      return avgB - avgA;
    });
  }, [facts, factsSort]);

  const renderSortHeader = (key, label) => (
    <span className="inline-flex items-center gap-1">
      <span>{label}</span>
      {factsSort === key ? <span aria-hidden="true">↓</span> : null}
    </span>
  );

  const handleDetailLoaded = (data, key) => {
    setLastFactDetail(data);
    setLastFactKey(key);
  };

  const getFactStableId = (f) => f?._id ?? f?.id ?? f?.factId ?? f?.fact?._id ?? null;
  const mergeFacts = (prevFacts, nextFacts) => {
    const combined = [...prevFacts, ...nextFacts];
    const hasStableIds = combined.some((f) => getFactStableId(f) != null);
    if (!hasStableIds) {
      return combined;
    }

    const seen = new Set();
    const merged = [];
    combined.forEach((f) => {
      const stableId = getFactStableId(f);
      if (stableId == null) {
        merged.push(f);
        return;
      }
      const idKey = String(stableId);
      if (seen.has(idKey)) return;
      seen.add(idKey);
      merged.push(f);
    });
    return merged;
  };

  const escapeCsv = (value) => {
    if (value == null) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const formatCsvDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return ATTEMPT_DATE_TIME_FORMATTER.format(d);
  };

  const handleExportCsv = () => {
    const rows = [];
    const todayLabel = new Date().toISOString().slice(0, 10);

    rows.push(["Summary Totals"]);
    rows.push(["Student name", studentInfo.name || ""]);
    rows.push(["Current level", studentInfo.level || ""]);
    rows.push(["Current belt", studentInfo.belt || ""]);
    rows.push(["PIN", pin || ""]);
    rows.push(["Date (exported)", todayLabel]);
    rows.push(["Level filter", level]);
    rows.push(["Operation filter", operation]);
    rows.push([
      "Total attempts",
      summary?.overall?.totalAttempts ?? 0,
    ]);
    rows.push([
      "Total correct",
      summary?.overall?.totalCorrect ?? 0,
    ]);
    rows.push([
      "Accuracy",
      pct(summary?.overall?.accuracy ?? 0),
    ]);
    rows.push([]);
    rows.push(["Facts"]);
    rows.push(["Question", "Accuracy", "Attempts", "Avg Time", "Last Attempt", "Flags"]);
    sortedFacts.forEach((f) => {
      rows.push([
        f.question,
        pct(f.stats?.accuracy),
        f.stats?.totalAttempts ?? 0,
        ms(f.stats?.avgMs),
        f.stats?.lastAttemptAt ? new Date(f.stats.lastAttemptAt).toLocaleDateString() : "--",
        `${f.stats?.mastered ? "mastered" : ""}${f.stats?.struggling ? " struggling" : ""}`.trim(),
      ]);
    });

    rows.push([]);
    rows.push(["Recent Attempts (Selected Fact)"]);
    rows.push([
      "Question",
      "Timestamp",
      "Correct",
      "User Answer",
      "Correct Answer",
      "Response Ms",
      "Mode",
      "Choices",
    ]);

    if (lastFactDetail?.recentAttempts?.length) {
      lastFactDetail.recentAttempts.forEach((a) => {
        rows.push([
          lastFactDetail?.fact?.question || "",
          formatCsvDate(a.attemptedAt),
          a.correct ? "Correct" : "Wrong",
          a.userAnswer ?? "",
          a.correctAnswer ?? "",
          a.responseMs ?? "",
          a.gameMode ? "Game mode" : "Quiz",
          Array.isArray(a.choices) ? a.choices.join(" ") : "",
        ]);
      });
    } else {
      rows.push(["", "", "No recent attempts loaded", "", "", "", "", ""]);
    }

    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics_${pin || "user"}_${todayLabel}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!pin) return;

    let cancelled = false;
    const loadStudentInfo = async () => {
      const initialName = toSafeStudentText(location.state?.studentName, "Loading...");
      const initialLevel = toSafeStudentText(location.state?.studentLevel, "Loading...");
      const initialBelt = toSafeStudentText(location.state?.studentBelt, "Loading...");
      const initialPin = toSafeStudentText(routePin || location.state?.studentPin || pin, "N/A");

      setStudentInfo((prev) => ({
        ...prev,
        name: initialName,
        level: initialLevel,
        belt: initialBelt,
        pin: initialPin,
      }));

      const adminPin = localStorage.getItem("math-admin-pin") || "";

      const [progressResult, adminStudent] = await Promise.allSettled([
        userGetProgress(pin),
        findStudentFromAdminStats(adminPin, pin),
      ]);

      if (cancelled) return;

      const progressPayload =
        progressResult.status === "fulfilled" ? progressResult.value?.progress : null;
      const progressInfo = getCurrentProgress(progressPayload);
      const resolvedName =
        adminStudent.status === "fulfilled" ? toSafeStudentText(adminStudent.value?.name, "") : "";

      setStudentInfo((prev) => ({
        name: resolvedName || (prev.name === "Loading..." ? "N/A" : prev.name),
        level: progressInfo.level || prev.level || "N/A",
        belt: progressInfo.belt || prev.belt || "N/A",
        pin: toSafeStudentText(pin, prev.pin || "N/A"),
      }));
    };

    loadStudentInfo().catch(() => {
      if (cancelled) return;
      setStudentInfo((prev) => ({
        ...prev,
        name: prev.name === "Loading..." ? "N/A" : prev.name,
        level: prev.level === "Loading..." ? "N/A" : prev.level,
        belt: prev.belt === "Loading..." ? "N/A" : prev.belt,
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [pin, routePin, location.state]);

  useEffect(() => {
    if (!pin) {
      setError("Missing user PIN. Please log in again.");
      setLoadingTop(false);
      setLoadingFacts(false);
      return;
    }

    let alive = true;
    async function loadTop() {
      setLoadingTop(true);
      setError("");
      try {
        const [s, st] = await Promise.all([
          analyticsGetSummary(pin),
          analyticsGetStruggling(pin, { level, limit: 10 }),
        ]);
        if (!alive) return;
        setSummary(s);
        setStruggling(st);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load analytics");
      } finally {
        if (alive) setLoadingTop(false);
      }
    }
    loadTop();
    return () => {
      alive = false;
    };
  }, [pin, level]);

  const loadFacts = useCallback(
    async (nextOffset = 0, { append = false } = {}) => {
      if (!pin) return;
      const requestSeq = ++factsRequestSeqRef.current;

      if (append) {
        setLoadingMoreFacts(true);
      } else {
        setLoadingFacts(true);
      }
      setError("");

      try {
        const data = await analyticsGetFacts(pin, {
          level,
          operation,
          limit: FACTS_PAGE_SIZE,
          offset: nextOffset,
        });
        if (requestSeq !== factsRequestSeqRef.current) return;

        const nextFacts = Array.isArray(data?.facts) ? data.facts : [];
        setFacts((prev) => (append ? mergeFacts(prev, nextFacts) : nextFacts));

        const rawPagination = data?.pagination || {};
        const limit = Number(rawPagination.limit);
        const resolvedLimit = Number.isFinite(limit) && limit > 0 ? limit : FACTS_PAGE_SIZE;
        const offset = Number(rawPagination.offset);
        const resolvedOffset = Number.isFinite(offset) && offset >= 0 ? offset : nextOffset;
        const totalRaw = Number(rawPagination.total ?? rawPagination.totalCount);
        const hasMore = Boolean(rawPagination.hasMore);

        setPagination((prev) => ({
          limit: resolvedLimit,
          nextOffset: resolvedOffset + resolvedLimit,
          total: Number.isFinite(totalRaw) && totalRaw >= 0 ? totalRaw : prev.total,
          hasMore,
        }));
      } catch (e) {
        if (requestSeq !== factsRequestSeqRef.current) return;
        setError(e?.message || "Failed to load facts");
      } finally {
        if (append) {
          setLoadingMoreFacts(false);
        } else {
          setLoadingFacts(false);
        }
      }
    },
    [pin, level, operation]
  );

  useEffect(() => {
    setFacts([]);
    setPagination({
      limit: FACTS_PAGE_SIZE,
      nextOffset: 0,
      total: 0,
      hasMore: false,
    });
    loadFacts(0, { append: false });
  }, [loadFacts]);

  const loadMoreFacts = useCallback(() => {
    if (!pagination.hasMore || loadingFacts || loadingMoreFacts) return;
    loadFacts(pagination.nextOffset, { append: true });
  }, [pagination.hasMore, pagination.nextOffset, loadingFacts, loadingMoreFacts, loadFacts]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !pagination.hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          loadMoreFacts();
        }
      },
      { root: null, rootMargin: "200px 0px", threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [pagination.hasMore, loadMoreFacts]);

  const openFact = (f) => {
    setDetailFact({ operation: f.operation, a: f.a, b: f.b });
    setDetailOpen(true);
  };

  const levelDisplay = useMemo(() => {
    const raw = String(studentInfo.level || "").trim();
    if (!raw || raw === "Loading..." || raw === "N/A") return raw || "N/A";
    const match = raw.match(/L(\d+)/i);
    if (match?.[1]) return `Level ${match[1]}`;
    return raw;
  }, [studentInfo.level]);

  const beltBadgeTone = useMemo(() => {
    const safe = String(studentInfo.belt || "").toLowerCase();
    if (safe.includes("black")) return "bg-slate-700/90 text-slate-100 border-slate-500/60";
    if (safe.includes("blue")) return "bg-blue-500/90 text-white border-blue-300/60";
    if (safe.includes("yellow")) return "bg-yellow-400/90 text-slate-900 border-yellow-200/70";
    if (safe.includes("green")) return "bg-emerald-500/90 text-white border-emerald-300/60";
    if (safe.includes("red")) return "bg-red-500/90 text-white border-red-300/60";
    if (safe.includes("brown")) return "bg-amber-700/90 text-amber-100 border-amber-500/60";
    if (safe.includes("white")) return "bg-slate-100/95 text-slate-900 border-slate-300/80";
    return "bg-cyan-500/90 text-white border-cyan-300/60";
  }, [studentInfo.belt]);

  const avatarInitials = useMemo(() => getAvatarInitials(studentInfo.name), [studentInfo.name]);
  const avatarGradientStyle = useMemo(
    () => getAvatarGradient(studentInfo.name),
    [studentInfo.name]
  );

  const dashboardStyle = {
    background:
      "radial-gradient(1100px 540px at 16% -10%, rgba(36, 133, 255, 0.32), transparent 60%), radial-gradient(920px 500px at 88% 4%, rgba(53, 211, 255, 0.2), transparent 56%), linear-gradient(140deg, #030711 0%, #051126 44%, #021121 100%)",
    minHeight: "100vh",
    paddingTop: "max(env(safe-area-inset-top), 1rem)",
    paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
  };

  return (
    <div style={dashboardStyle} className="relative overflow-hidden text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[url('/night_sky_landscape.jpg')] bg-cover bg-center opacity-[0.14]"
      />
      <div className="relative z-[1] mx-auto w-full max-w-[1280px] px-4 py-4 md:px-6 md:py-6">
        <div className="mb-5 grid grid-cols-[auto_1fr_auto] items-center gap-3 md:mb-6">
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200/20 bg-[#0c1f4f]/70 px-4 py-2.5 font-bold text-blue-50 transition-colors hover:bg-[#12306f]/80"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft className="text-sm" />
            <span>Back</span>
          </button>
          <div className="flex items-center justify-center gap-3 text-4xl md:text-5xl font-black tracking-tight text-blue-50">
            <FaChartLine className="text-2xl md:text-4xl text-blue-300" />
            <span>Analytics</span>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200/20 bg-[#0c1f4f]/70 px-4 py-2.5 font-extrabold text-blue-50 transition-colors hover:bg-[#12306f]/80"
          >
            Export CSV
          </button>
        </div>

        {(loadingTop || loadingFacts) && (
          <div className="mb-4 animate-pulse text-blue-100/80">Loading analytics...</div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-300/50 bg-red-950/40 p-4 text-red-100">
            {error}
          </div>
        )}

        <div className="relative mb-4 overflow-hidden rounded-2xl border border-blue-200/15 bg-[#0b1f4f]/72 shadow-[0_18px_44px_rgba(2,8,30,0.5)]">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-3/5 bg-[radial-gradient(circle_at_80%_55%,rgba(76,125,255,0.3),rgba(11,31,79,0)_70%)] opacity-80" />
          <div className="relative flex items-center gap-4 p-4 md:p-6">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full border border-blue-100/35 shadow-[0_10px_24px_rgba(2,8,30,0.45)]"
              style={avatarGradientStyle}
            >
              <span className="text-3xl font-black text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
                {avatarInitials}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-3xl font-black leading-none text-white md:text-4xl">
                {studentInfo.name}
              </h2>
              <span
                className={`mt-3 inline-flex rounded-xl border px-3 py-1 text-base font-bold ${beltBadgeTone}`}
              >
                {studentInfo.belt} Belt
              </span>
            </div>
          </div>
          <div className="relative flex items-center justify-between gap-3 border-t border-blue-100/15 bg-[#06173d]/75 px-4 py-3 md:px-6">
            <div className="inline-flex items-center gap-2 text-xl font-bold md:text-2xl">
              <FaLayerGroup className="text-lg text-blue-200/80" />
              <span>{levelDisplay}</span>
            </div>
            <div className="text-xl font-black tracking-wide text-blue-50 md:text-2xl">
              <span className="mr-1 text-base font-semibold text-blue-100/80 md:text-lg">PIN:</span>
              <span>{`${studentInfo.pin}`}</span>
            </div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:mb-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-300/35 bg-[linear-gradient(140deg,rgba(39,74,186,0.32),rgba(14,31,83,0.9))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="mb-1 flex items-center gap-2.5 text-sm font-semibold text-blue-100/85 md:text-lg">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-blue-200/35 bg-blue-500/20 text-sm">
                <FaBullseye />
              </span>
              <span>Total Attempts</span>
            </div>
            <div className="text-4xl font-black leading-none text-white md:text-3xl">
              {summary?.overall?.totalAttempts ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-300/35 bg-[linear-gradient(140deg,rgba(17,112,99,0.3),rgba(10,61,67,0.88))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="mb-1 flex items-center gap-2.5 text-sm font-semibold text-emerald-100/85 md:text-lg">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200/35 bg-emerald-500/20 text-sm">
                <FaCheckCircle />
              </span>
              <span>Total Correct</span>
            </div>
            <div className="text-4xl font-black leading-none text-white md:text-3xl">
              {summary?.overall?.totalCorrect ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-violet-300/35 bg-[linear-gradient(140deg,rgba(95,66,192,0.35),rgba(35,24,89,0.9))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="mb-1 flex items-center gap-2.5 text-sm font-semibold text-violet-100/85 md:text-lg">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-violet-200/35 bg-violet-500/20 text-sm">
                <FaChartLine />
              </span>
              <span>Accuracy</span>
            </div>
            <div className="text-4xl font-black leading-none text-white md:text-3xl">
              {pct(summary?.overall?.accuracy ?? 0)}
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-blue-200/15 bg-[#0b1f4f]/72 p-4 md:mb-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-sm font-semibold text-blue-100/80">Level</div>
              <select
                className="w-full rounded-xl border border-blue-100/15 bg-[#142d65] px-3 py-2.5 text-white outline-none transition-colors focus:border-blue-300/45"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                {availableLevels.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="mb-1 text-sm font-semibold text-blue-100/80">Operation</div>
              <select
                className="w-full rounded-xl border border-blue-100/15 bg-[#142d65] px-3 py-2.5 text-white outline-none transition-colors focus:border-blue-300/45"
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
              >
                {OPS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-blue-200/15 bg-[#0b1f4f]/72 p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2 text-2xl font-bold">
            <FaExclamationTriangle className="text-amber-300" />
            <span>Struggling Facts</span>
          </div>

          {Array.isArray(struggling?.strugglingFacts) && struggling.strugglingFacts.length === 0 && (
            <div className="text-blue-100/70">No struggling facts yet.</div>
          )}

          {Array.isArray(struggling?.strugglingFacts) && struggling.strugglingFacts.length > 0 && (
            <div className="overflow-auto rounded-xl border border-blue-100/10">
              <table className="w-full min-w-[520px] text-left">
                <thead className="bg-[#10295f] text-sm text-blue-100/75">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Fact</th>
                    <th className="px-4 py-3 text-center font-semibold">Attempts</th>
                    <th className="px-4 py-3 text-center font-semibold">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {struggling?.strugglingFacts?.map((sf, idx) => (
                    <tr
                      key={`${sf.question}-${idx}`}
                      className="cursor-pointer border-t border-blue-100/10 bg-[#0a1d49]/70 transition-colors hover:bg-[#12316f]/75"
                      onClick={() => openFact({ operation: sf.fact.operation, a: sf.fact.a, b: sf.fact.b })}
                    >
                      <td className="px-4 py-3 text-lg font-semibold text-blue-50">{sf.question}</td>
                      <td className="px-4 py-3 text-center text-base font-bold tabular-nums text-blue-100">
                        {sf.totalAttempts}
                      </td>
                      <td className="px-4 py-3 text-center text-base font-bold tabular-nums text-emerald-200">
                        {pct(sf.accuracy)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-blue-200/15 bg-[#0b1f4f]/72 p-4 md:p-5">
          <div className="mb-4 flex items-center gap-2 text-2xl font-bold">
            <FaChartLine className="text-blue-300" />
            <span>Facts Performance</span>
          </div>

          {loadingFacts && <div className="text-blue-100/70">Loading facts...</div>}

          {!loadingFacts && Array.isArray(sortedFacts) && sortedFacts.length === 0 && (
            <div className="text-blue-100/70">No facts match this filter yet.</div>
          )}

          {!loadingFacts && sortedFacts.length > 0 && (
            <div className="overflow-auto rounded-xl border border-blue-100/10">
              <table className="w-full min-w-[760px] text-left">
                <thead className="text-sm text-blue-100/75 bg-[#10295f]">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Question</th>
                    <th className="px-3 py-3 text-center font-semibold">
                      <button
                        type="button"
                        onClick={() => setFactsSort(FACT_SORT.ACCURACY)}
                        className="inline-flex w-full items-center justify-center border-0 bg-transparent p-0 font-inherit leading-none text-inherit transition-colors hover:text-white"
                      >
                        {renderSortHeader(FACT_SORT.ACCURACY, "Accuracy")}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">
                      <button
                        type="button"
                        onClick={() => setFactsSort(FACT_SORT.ATTEMPTS)}
                        className="inline-flex w-full items-center justify-center border-0 bg-transparent p-0 font-inherit leading-none text-inherit transition-colors hover:text-white"
                      >
                        {renderSortHeader(FACT_SORT.ATTEMPTS, "Attempts")}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center font-semibold">
                      <button
                        type="button"
                        onClick={() => setFactsSort(FACT_SORT.AVG)}
                        className="inline-flex w-full items-center justify-center border-0 bg-transparent p-0 font-inherit leading-none text-inherit transition-colors hover:text-white"
                      >
                        {renderSortHeader(FACT_SORT.AVG, "Avg")}
                      </button>
                    </th>
                    <th className="px-3 py-3 font-semibold">Last Attempt</th>
                    <th className="px-3 py-3 font-semibold">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFacts.map((f, idx) => (
                    <tr
                      key={
                        getFactStableId(f) ??
                        `${f.operation}-${f.a}-${f.b}-${f.question ?? ""}-${idx}`
                      }
                      className="cursor-pointer border-t border-blue-100/10 bg-[#0a1d49]/70 transition-colors hover:bg-[#12316f]/75"
                      onClick={() => openFact(f)}
                    >
                      <td className="px-3 py-3 font-semibold text-blue-50">{f.question}</td>
                      <td className="px-3 py-3 text-center tabular-nums">{pct(f.stats?.accuracy)}</td>
                      <td className="px-3 py-3 text-center tabular-nums">{f.stats?.totalAttempts ?? 0}</td>
                      <td className="px-3 py-3 text-center tabular-nums">{ms(f.stats?.avgMs)}</td>
                      <td className="px-3 py-3">
                        {f.stats?.lastAttemptAt ? new Date(f.stats.lastAttemptAt).toLocaleDateString() : "--"}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        {(f.stats?.mastered || f.stats?.struggling) ? (
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 font-bold ${
                              f.stats?.struggling
                                ? "border-amber-300/35 bg-amber-500/20 text-amber-100"
                                : "border-emerald-300/35 bg-emerald-500/20 text-emerald-100"
                            }`}
                          >
                            {`${f.stats?.mastered ? "mastered" : ""}${f.stats?.struggling ? " struggling" : ""}`.trim()}
                          </span>
                        ) : (
                          <span className="text-blue-100/45">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-sm text-blue-100/70">
            <div>
              Showing {sortedFacts.length > 0 ? 1 : 0}-{sortedFacts.length} of{" "}
              {pagination.total || sortedFacts.length}
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-xl border border-blue-200/20 bg-[#17397f] px-4 py-2 font-semibold text-blue-50 transition-colors hover:bg-[#1e4799] disabled:opacity-50"
                disabled={!pagination.hasMore || loadingMoreFacts || loadingFacts}
                onClick={loadMoreFacts}
              >
                {loadingMoreFacts ? "Loading..." : "Load more"}
              </button>
            </div>
          </div>

          {loadingMoreFacts && (
            <div className="mt-3 text-sm text-blue-100/70">Loading more facts...</div>
          )}
          {!pagination.hasMore && !loadingFacts && sortedFacts.length > 0 && (
            <div className="mt-3 text-sm text-blue-100/60">All facts loaded.</div>
          )}
          <div ref={loadMoreRef} className="h-2" />
        </div>

        <div className="mt-5 text-center text-sm text-blue-200/55">
          Analytics data is updated in real-time.
        </div>
      </div>

      <FactDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        pin={pin}
        factKey={detailFact}
        onDetailLoaded={handleDetailLoaded}
      />
    </div>
  );
}
