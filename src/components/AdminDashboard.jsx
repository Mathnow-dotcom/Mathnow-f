import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSignOutAlt,
  FaCog,
  FaUsers,
  FaClock,
  FaTrophy,
  FaChartLine,
  FaCircle,
  FaStar,
  FaFire,
  FaUserPlus,
  FaTimes,
  FaClipboardList,
} from 'react-icons/fa';
import { adminCreateUser, getAdminStats, userGetProgress } from '../api/mathApi.js';
import '../styles/AdminDashboard.css';
import { currentProgramProgress } from '../utils/currentProgress.js';
import AdminBrand from './admin/AdminBrand.jsx';

const MS_PER_SEC = 1000;
const PROGRESS_PLACEHOLDER = 'Loading...';
const LOADING_DOTS = ['.', '..', '...'];
const SCHOOL_OPTIONS = ['School A', 'School B', 'School C'];
const GRADE_OPTIONS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const EMPTY_USER_FORM = { name: '', pin: '', school: '', grade: '' };

const formatTime = (ms) => {
  const safeMs = Number(ms);
  if (!Number.isFinite(safeMs) || safeMs < MS_PER_SEC) return '0s';
  const totalSeconds = Math.round(safeMs / MS_PER_SEC);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const formatCompactTime = (ms) => {
  const safeMs = Number(ms);
  if (!Number.isFinite(safeMs) || safeMs <= 0) return '0m';
  const totalMinutes = Math.round(safeMs / (60 * MS_PER_SEC));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const OPERATION_ORDER = ['add', 'sub', 'mul', 'div', 'frac'];

const toSafeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toSafeInteger = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
};

const formatStudentNameForDashboard = (name = '') => {
  const safeName = String(name).trim();
  if (!safeName) return 'Unknown';
  return safeName.charAt(0).toUpperCase() + safeName.slice(1).toLowerCase();
};

const getInitial = (name = '') => {
  const safe = String(name).trim();
  return safe ? safe.charAt(0).toUpperCase() : '?';
};

const AVATAR_TONES = [
  'admin-dashboard__avatar--emerald',
  'admin-dashboard__avatar--violet',
  'admin-dashboard__avatar--sky',
  'admin-dashboard__avatar--amber',
  'admin-dashboard__avatar--rose',
  'admin-dashboard__avatar--teal',
  'admin-dashboard__avatar--blue',
];

const getAvatarToneClass = (name = '') => {
  const initial = getInitial(name);
  const code = initial.charCodeAt(0);
  if (!Number.isFinite(code)) return AVATAR_TONES[0];
  return AVATAR_TONES[code % AVATAR_TONES.length];
};

const getBeltLabel = (levelData = {}) => {
  const beltsOrder = ['white', 'yellow', 'green', 'blue', 'red', 'brown'];
  let currentBelt = 'White';

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
    return 'Level Mastered';
  }
  return currentBelt;
};

const parseLevelsFromNode = (node = {}) =>
  Object.keys(node)
    .filter((k) => k.startsWith('L'))
    .map((k) => ({ key: k, level: parseInt(k.substring(1), 10), data: node[k] }))
    .filter((x) => Number.isFinite(x.level))
    .sort((a, b) => a.level - b.level);

const hasFlatLevelKeys = (node) =>
  !!node &&
  typeof node === 'object' &&
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
  const current = currentProgramProgress(progress);
  if (current) return { level: `${current.operation.toUpperCase()} L${current.level}`, belt: getBeltLabel(current.data) };
  if (!progress) return { level: 'N/A', belt: 'N/A' };

  const hasScopedOps = OPERATION_ORDER.some(
    (op) => progress?.[op] && typeof progress[op] === 'object'
  );

  // Backward-compatible: old flat format { L1, L2, ... }.
  if (!hasScopedOps && hasFlatLevelKeys(progress)) {
    const flatLevels = parseLevelsFromNode(progress);
    if (flatLevels.length > 0) {
      const currentLevelInfo = pickCurrentLevelFromLevels(flatLevels);
      if (!currentLevelInfo) return { level: 'N/A', belt: 'N/A' };
      return {
        level: `L${currentLevelInfo.level}`,
        belt: getBeltLabel(currentLevelInfo.data),
      };
    }
  }

  // New format: operation-scoped { add: {L1...}, sub: {L1...}, ... }
  const opSnapshots = OPERATION_ORDER.map((operation) => {
    const levels = parseLevelsFromNode(progress?.[operation] || {});
    if (!levels.length) return null;
    const current = pickCurrentLevelFromLevels(levels);
    if (!current || !current.data?.unlocked) return null;
    return { operation, current };
  }).filter(Boolean);

  if (!opSnapshots.length) return { level: 'N/A', belt: 'N/A' };

  // Match operation picker behavior: highest unlocked incomplete operation.
  const highestUnlockedIncompleteOp = [...opSnapshots]
    .reverse()
    .find((entry) => !entry.current.data?.completed);
  const active = highestUnlockedIncompleteOp || opSnapshots[opSnapshots.length - 1];
  const opLabel = active.operation.toUpperCase();

  return {
    level: `${opLabel} L${active.current.level}`,
    belt: getBeltLabel(active.current.data),
  };
};

const getLevelToneClass = (level = '') => {
  const safe = String(level).toUpperCase();
  if (!safe || safe === 'N/A' || safe === 'ERROR' || safe === PROGRESS_PLACEHOLDER.toUpperCase()) {
    return 'admin-dashboard__pill--neutral';
  }
  if (safe.includes('MUL')) return 'admin-dashboard__pill--green';
  if (safe.includes('DIV')) return 'admin-dashboard__pill--blue';
  if (safe.includes('SUB')) return 'admin-dashboard__pill--violet';
  if (safe.includes('ADD')) return 'admin-dashboard__pill--amber';
  return 'admin-dashboard__pill--sky';
};

const getBeltToneClass = (belt = '') => {
  const safe = String(belt).toLowerCase();
  if (!safe || safe === 'n/a' || safe === 'error' || safe === PROGRESS_PLACEHOLDER.toLowerCase()) {
    return 'admin-dashboard__pill--neutral';
  }
  if (safe.includes('black')) return 'admin-dashboard__pill--dark';
  if (safe.includes('white')) return 'admin-dashboard__pill--white';
  if (safe.includes('yellow')) return 'admin-dashboard__pill--yellow';
  if (safe.includes('green')) return 'admin-dashboard__pill--green';
  if (safe.includes('blue')) return 'admin-dashboard__pill--blue';
  if (safe.includes('red')) return 'admin-dashboard__pill--red';
  if (safe.includes('brown')) return 'admin-dashboard__pill--brown';
  return 'admin-dashboard__pill--neutral';
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDots, setLoadingDots] = useState(LOADING_DOTS[0]);
  const [error, setError] = useState(null);

  // Pagination states
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const loadMoreSentinelRef = useRef(null);
  const requestingNextPageRef = useRef(false);

  const [adminPin, setAdminPin] = useState(() => localStorage.getItem('math-admin-pin'));
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createUserForm, setCreateUserForm] = useState(EMPTY_USER_FORM);
  const [createUserError, setCreateUserError] = useState('');
  const [createUserSuccess, setCreateUserSuccess] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    const storedPin = localStorage.getItem('math-admin-pin');
    if (storedPin !== adminPin) {
      setAdminPin(storedPin);
    }
  }, [adminPin]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== 'math-admin-pin') return;
      setAdminPin(event.newValue || '');
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const fetchStats = useCallback(async () => {
    const storedPin = localStorage.getItem('math-admin-pin') || adminPin;
    if (!storedPin) {
      navigate('/name');
      return;
    }

    try {
      setLoading(true);

      const statsResponse = await getAdminStats(storedPin, limit, offset);
      const initialData = Array.isArray(statsResponse)
        ? statsResponse
        : Array.isArray(statsResponse?.data)
          ? statsResponse.data
          : [];

      const hasMoreFromHeader =
        typeof statsResponse?.pagination?.hasMore === 'boolean'
          ? statsResponse.pagination.hasMore
          : null;
      setHasMore(hasMoreFromHeader ?? initialData.length >= limit);

      const parsedTotalCount = Number(statsResponse?.pagination?.totalCount);
      setTotalCount(Number.isFinite(parsedTotalCount) ? parsedTotalCount : null);

      const initialRows = initialData.map((student) => ({
        ...student,
        currentLevel: PROGRESS_PLACEHOLDER,
        currentBelt: PROGRESS_PLACEHOLDER,
      }));

      if (offset === 0) {
        setStats(initialRows);
      } else {
        setStats((prev) => [...prev, ...initialRows]);
      }

      setLastUpdatedAt(new Date());
      setError(null);

      initialData.forEach((student) => {
        userGetProgress(student.pin)
          .then((progressResponse) => {
            const progress = progressResponse?.progress;
            const progressInfo = getCurrentProgress(progress);

            setStats((prev) =>
              prev.map((existing) =>
                existing.pin === student.pin
                  ? {
                      ...existing,
                      currentLevel: progressInfo.level,
                      currentBelt: progressInfo.belt,
                    }
                  : existing
              )
            );
          })
          .catch((e) => {
            console.warn(`Failed to fetch progress for ${student.name} (${student.pin}):`, e);
            setStats((prev) =>
              prev.map((existing) =>
                existing.pin === student.pin
                  ? {
                      ...existing,
                      currentLevel: 'Error',
                      currentBelt: 'Error',
                    }
                  : existing
              )
            );
          });
      });
    } catch (e) {
      console.error('Failed to fetch admin stats or progress:', e);
      setError(e.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [adminPin, offset, navigate, refreshKey]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!loading) {
      requestingNextPageRef.current = false;
    }
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      setLoadingDots(LOADING_DOTS[0]);
      return undefined;
    }

    let dotIndex = 0;
    const intervalId = setInterval(() => {
      dotIndex = (dotIndex + 1) % LOADING_DOTS.length;
      setLoadingDots(LOADING_DOTS[dotIndex]);
    }, 450);

    return () => clearInterval(intervalId);
  }, [loading]);

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (loading || requestingNextPageRef.current || !hasMore) return;
        requestingNextPageRef.current = true;
        setOffset((prev) => prev + limit);
      },
      {
        root: null,
        rootMargin: '240px 0px 240px 0px',
        threshold: 0.05,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, limit]);

  const handleLogout = () => {
    localStorage.removeItem('math-admin-pin');
    navigate('/name', { replace: true });
  };

  const openCreateUser = () => {
    setCreateUserForm(EMPTY_USER_FORM);
    setCreateUserError('');
    setCreateUserSuccess('');
    setShowCreateUser(true);
  };

  const closeCreateUser = () => {
    if (creatingUser) return;
    setShowCreateUser(false);
    setCreateUserError('');
    setCreateUserSuccess('');
  };

  const updateCreateUserField = (field, value) => {
    const nextValue = field === 'pin' ? value.replace(/\D/g, '').slice(0, 4) : value;
    setCreateUserForm((previous) => ({ ...previous, [field]: nextValue }));
    setCreateUserError('');
    setCreateUserSuccess('');
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    if (creatingUser) return;

    const name = createUserForm.name.trim();
    const pin = createUserForm.pin.trim();
    if (name.length < 2) {
      setCreateUserError('Enter a name with at least 2 characters.');
      return;
    }
    if (!/^\d{2,4}$/.test(pin)) {
      setCreateUserError('Enter a PIN containing 2 to 4 digits.');
      return;
    }
    if (!createUserForm.school || !createUserForm.grade) {
      setCreateUserError('Select both a school and grade level.');
      return;
    }

    const storedPin = localStorage.getItem('math-admin-pin') || adminPin;
    if (!storedPin) {
      navigate('/name', { replace: true });
      return;
    }

    try {
      setCreatingUser(true);
      setCreateUserError('');
      const response = await adminCreateUser(storedPin, {
        name,
        pin,
        school: createUserForm.school,
        grade: createUserForm.grade,
      });
      setCreateUserSuccess(response?.message || 'User created successfully');
      setCreateUserForm(EMPTY_USER_FORM);
      setStats([]);
      setOffset(0);
      setRefreshKey((key) => key + 1);
    } catch (creationError) {
      setCreateUserError(creationError?.message || 'Unable to create the user.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleViewStats = (student) => {
    if (!student?.pin) return;
    navigate(`/admin/students/${student.pin}/analytics`, {
      state: {
        studentName: student.name || '',
        studentLevel: student.currentLevel || 'N/A',
        studentBelt: student.currentBelt || 'N/A',
        studentPin: student.pin,
      },
    });
  };

  const summary = useMemo(() => {
    const loadedStudents = stats.length;
    const totalStudentsFromApi = Number.isFinite(totalCount) ? totalCount : loadedStudents;
    const totalStudents = Math.max(totalStudentsFromApi, loadedStudents);
    const onlineStudents = stats.reduce(
      (acc, student) => acc + (Boolean(student?.loggedInToday) ? 1 : 0),
      0
    );

    const totalTimeMs = stats.reduce(
      (acc, student) => acc + toSafeNumber(student?.grandTotalActiveMs),
      0
    );

    const totalScore = stats.reduce(
      (acc, student) => acc + toSafeNumber(student?.grandTotalCorrect),
      0
    );

    return {
      totalStudents,
      loadedStudents,
      onlineStudents,
      totalTimeMs,
      totalScore,
    };
  }, [stats, totalCount]);

  const dashboardStyle = {
    minHeight: '100vh',
    paddingTop: 'max(env(safe-area-inset-top), 1rem)',
    paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
  };

  if (loading && offset === 0 && stats.length === 0) {
    return (
      <div
        className="admin-classroom-page fixed inset-0 z-[102] flex items-center justify-center"
        style={{
          backgroundImage: "url('/Mathnow_bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <AdminBrand className="admin-brand--floating" />
        <div className="rounded-3xl border border-sky-200/70 bg-white/90 px-7 py-5 text-center text-[#18345b] shadow-2xl backdrop-blur-md">
          <p className="m-0 text-xl sm:text-2xl font-extrabold tracking-wide">
            Loading Admin Dashboard
            <span className="inline-block w-[2.2ch] text-left" aria-hidden="true">
              {loadingDots}
            </span>
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard admin-classroom-page admin-dashboard__state" style={dashboardStyle}>
        <AdminBrand className="admin-brand--floating" />
        <h1 className="admin-dashboard__title">Admin Dashboard</h1>
        <p className="admin-dashboard__state-error">{error}</p>
        <button
          onClick={handleLogout}
          className="admin-dashboard__btn admin-dashboard__btn--logout"
        >
          <FaSignOutAlt className="admin-dashboard__btn-icon" />
          <span>Logout</span>
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard admin-classroom-page" style={dashboardStyle}>
      <div className="admin-dashboard__shell">
        <AdminBrand />
        <header className="admin-dashboard__topbar">
          <div className="admin-dashboard__heading-wrap">
            <div className="admin-dashboard__title-icon" aria-hidden="true">
              <FaChartLine />
            </div>
            <div>
              <h1 className="admin-dashboard__title">Student Stats</h1>
              <p className="admin-dashboard__subtitle">Track student progress, time spent, and performance</p>
            </div>
          </div>

          <div className="admin-dashboard__actions">
            <button
              onClick={openCreateUser}
              type="button"
              className="admin-dashboard__btn admin-dashboard__btn--create"
              aria-label="Create a new student"
            >
              <FaUserPlus className="admin-dashboard__btn-icon" />
              <span>Create User</span>
            </button>
            <button
              onClick={() => navigate('/admin/tests')}
              type="button"
              className="admin-dashboard__btn admin-dashboard__btn--settings"
            >
              <FaClipboardList className="admin-dashboard__btn-icon" />
              <span>Test Results</span>
            </button>
            <button
              onClick={() => navigate('/admin-settings')}
              type="button"
              className="admin-dashboard__btn admin-dashboard__btn--settings"
              aria-label="Open app settings"
            >
              <FaCog className="admin-dashboard__btn-icon" />
              <span>App Settings</span>
            </button>
            <button
              onClick={handleLogout}
              type="button"
              className="admin-dashboard__btn admin-dashboard__btn--logout"
              aria-label="Logout"
            >
              <FaSignOutAlt className="admin-dashboard__btn-icon" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <section className="admin-dashboard__cards" aria-label="Summary cards">
          <article className="admin-dashboard__card">
            <div className="admin-dashboard__card-icon admin-dashboard__card-icon--blue" aria-hidden="true">
              <FaUsers />
            </div>
            <div>
              <p className="admin-dashboard__card-value">{summary.totalStudents}</p>
              <p className="admin-dashboard__card-label">Total Students</p>
            </div>
          </article>

          <article className="admin-dashboard__card">
            <div className="admin-dashboard__card-icon admin-dashboard__card-icon--green" aria-hidden="true">
              <FaClock />
            </div>
            <div>
              <p className="admin-dashboard__card-value">{formatCompactTime(summary.totalTimeMs)}</p>
              <p className="admin-dashboard__card-label">Total Time</p>
            </div>
          </article>

          <article className="admin-dashboard__card">
            <div className="admin-dashboard__card-icon admin-dashboard__card-icon--amber" aria-hidden="true">
              <FaTrophy />
            </div>
            <div>
              <p className="admin-dashboard__card-value">{summary.totalScore}</p>
              <p className="admin-dashboard__card-label">Total Score</p>
            </div>
          </article>

          <article className="admin-dashboard__card">
            <div className="admin-dashboard__card-icon admin-dashboard__card-icon--violet" aria-hidden="true">
              <FaChartLine />
            </div>
            <div>
              <p className="admin-dashboard__card-value">{summary.onlineStudents}</p>
              <p className="admin-dashboard__card-label">Students Logged In Today</p>
            </div>
          </article>
        </section>

        {stats.length === 0 ? (
          <p className="admin-dashboard__empty">No students found.</p>
        ) : (
          <>
            <div className="admin-dashboard__table-wrap">
              <table className="admin-dashboard__table">
                <colgroup>
                  <col className="admin-dashboard__col admin-dashboard__col--index" />
                  <col className="admin-dashboard__col admin-dashboard__col--student" />
                  <col className="admin-dashboard__col admin-dashboard__col--status" />
                  <col className="admin-dashboard__col admin-dashboard__col--streak" />
                  <col className="admin-dashboard__col admin-dashboard__col--level" />
                  <col className="admin-dashboard__col admin-dashboard__col--belt" />
                  <col className="admin-dashboard__col admin-dashboard__col--time" />
                  <col className="admin-dashboard__col admin-dashboard__col--score" />
                  <col className="admin-dashboard__col admin-dashboard__col--time" />
                  <col className="admin-dashboard__col admin-dashboard__col--score" />
                </colgroup>
                <thead>
                  <tr className="admin-dashboard__head-row admin-dashboard__head-row--group">
                    <th rowSpan={2} className="admin-dashboard__index-head">#</th>
                    <th rowSpan={2}>Student</th>
                    <th rowSpan={2}>Logged In Today</th>
                    <th rowSpan={2}>Streak</th>
                    <th rowSpan={2}>Level</th>
                    <th rowSpan={2}>Belt</th>
                    <th colSpan={2} className="admin-dashboard__group-head admin-dashboard__group-head--today">Today</th>
                    <th colSpan={2} className="admin-dashboard__group-head admin-dashboard__group-head--overall">Overall</th>
                  </tr>
                  <tr className="admin-dashboard__head-row admin-dashboard__head-row--sub">
                    <th className="admin-dashboard__sub-head admin-dashboard__sub-head--today-time">Time</th>
                    <th className="admin-dashboard__sub-head admin-dashboard__sub-head--today-score">Score</th>
                    <th className="admin-dashboard__sub-head admin-dashboard__sub-head--overall-time">Time</th>
                    <th className="admin-dashboard__sub-head admin-dashboard__sub-head--overall-score">Score</th>
                  </tr>
                </thead>

                <tbody>
                  {stats.map((student, index) => {
                    const studentName = formatStudentNameForDashboard(student.name);
                    const studentPin = student.pin;
                    const isOnline = Boolean(student.loggedInToday);
                    const currentStreak = toSafeInteger(student.currentStreak);
                    const streakLabel = `${currentStreak} day${currentStreak === 1 ? '' : 's'} `;

                    return (
                      <tr
                        key={student.id || student._id || student.pin}
                        onClick={() => handleViewStats(student)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleViewStats(student);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`View analytics for ${studentName}`}
                      >
                        <td className="admin-dashboard__row-number">{index + 1}</td>
                        <td>
                          <div className="admin-dashboard__student-cell">
                            <span
                              className={`admin-dashboard__avatar ${getAvatarToneClass(studentName)}`}
                              aria-hidden="true"
                            >
                              {getInitial(studentName)}
                            </span>
                            <span>
                              <strong className="admin-dashboard__student-name">{studentName}</strong>
                              <small className="admin-dashboard__student-pin">#{studentPin}</small>
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className={`admin-dashboard__status ${isOnline ? 'is-online' : 'is-offline'}`}>
                            <FaCircle aria-hidden="true" />
                            {isOnline ? 'YES' : 'NO'}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`admin-dashboard__streak ${isOnline ? 'is-online' : 'is-offline'} ${currentStreak === 0 ? 'is-zero' : ''}`}
                          >
                            <FaFire aria-hidden="true" />
                            {streakLabel}
                          </span>
                        </td>

                        <td>
                          <span className={`admin-dashboard__pill ${getLevelToneClass(student.currentLevel)}`}>
                            {student.currentLevel}
                          </span>
                        </td>

                        <td>
                          <span className={`admin-dashboard__pill ${getBeltToneClass(student.currentBelt)}`}>
                            {student.currentBelt}
                          </span>
                        </td>

                        <td className="admin-dashboard__metric-cell">
                          <span className="admin-dashboard__metric-content">
                            <FaClock aria-hidden="true" />
                            <span>{formatTime(student.todayActiveMs)}</span>
                          </span>
                        </td>

                        <td className="admin-dashboard__metric-cell admin-dashboard__metric-cell--score">
                          <span className="admin-dashboard__metric-content">
                            <FaStar aria-hidden="true" />
                            <span>{toSafeNumber(student.todayCorrect)}</span>
                          </span>
                        </td>

                        <td className="admin-dashboard__metric-cell">
                          <span className="admin-dashboard__metric-content">
                            <FaClock aria-hidden="true" />
                            <span>{formatTime(student.grandTotalActiveMs)}</span>
                          </span>
                        </td>

                        <td className="admin-dashboard__metric-cell admin-dashboard__metric-cell--trophy">
                          <span className="admin-dashboard__metric-content">
                            <FaTrophy aria-hidden="true" />
                            <span>{toSafeNumber(student.grandTotalCorrect)}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <footer className="admin-dashboard__footer">
              <div className="admin-dashboard__footer-chip">
                Showing 1 to {summary.loadedStudents} of {summary.totalStudents} students
              </div>
              <div className="admin-dashboard__footer-chip">
                Last updated:{' '}
                {lastUpdatedAt.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </footer>

            <div className="admin-dashboard__load-more">
              <div ref={loadMoreSentinelRef} className="admin-dashboard__sentinel" aria-hidden="true" />
              {hasMore && (
                <div className="admin-dashboard__loading-pill">
                  <span className="admin-dashboard__loading-spinner" aria-hidden="true" />
                  <span>{loading && offset > 0 ? 'Loading more students...' : 'Scroll down to load more'}</span>
                </div>
              )}
              {!hasMore && stats.length > 0 && (
                <div className="admin-dashboard__done-text">All students loaded</div>
              )}
            </div>
          </>
        )}
      </div>

      {showCreateUser && (
        <div className="admin-dashboard__modal-backdrop" role="presentation" onMouseDown={closeCreateUser}>
          <section
            className="admin-dashboard__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="admin-dashboard__modal-header">
              <div>
                <h2 id="create-user-title">Create Student User</h2>
                <p>Assign the credentials the student will use to log in.</p>
              </div>
              <button
                type="button"
                className="admin-dashboard__modal-close"
                onClick={closeCreateUser}
                aria-label="Close create user form"
                disabled={creatingUser}
              >
                <FaTimes />
              </button>
            </div>

            <form className="admin-dashboard__create-form" onSubmit={handleCreateUser}>
              <label>
                <span>Student Name</span>
                <input
                  type="text"
                  value={createUserForm.name}
                  onChange={(event) => updateCreateUserField('name', event.target.value)}
                  maxLength={15}
                  autoComplete="off"
                  placeholder="Enter student name"
                  disabled={creatingUser}
                />
              </label>

              <label>
                <span>Student PIN</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={createUserForm.pin}
                  onChange={(event) => updateCreateUserField('pin', event.target.value)}
                  maxLength={4}
                  autoComplete="off"
                  placeholder="2 to 4 digits"
                  disabled={creatingUser}
                />
              </label>

              <label>
                <span>School</span>
                <select
                  value={createUserForm.school}
                  onChange={(event) => updateCreateUserField('school', event.target.value)}
                  disabled={creatingUser}
                >
                  <option value="" disabled>Select a school</option>
                  {SCHOOL_OPTIONS.map((school) => <option key={school} value={school}>{school}</option>)}
                </select>
              </label>

              <label>
                <span>Grade Level</span>
                <select
                  value={createUserForm.grade}
                  onChange={(event) => updateCreateUserField('grade', event.target.value)}
                  disabled={creatingUser}
                >
                  <option value="" disabled>Select a grade</option>
                  {GRADE_OPTIONS.map((grade) => <option key={grade} value={grade}>{grade}</option>)}
                </select>
              </label>

              {createUserError && <p className="admin-dashboard__form-message is-error">{createUserError}</p>}
              {createUserSuccess && <p className="admin-dashboard__form-message is-success">{createUserSuccess}</p>}

              <div className="admin-dashboard__modal-actions">
                <button
                  type="button"
                  className="admin-dashboard__modal-secondary"
                  onClick={closeCreateUser}
                  disabled={creatingUser}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="admin-dashboard__modal-primary"
                  disabled={creatingUser}
                >
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
