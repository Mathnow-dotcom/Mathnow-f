import { useCallback, useEffect, useRef, useState } from 'react';

const IDLE_AFTER_MS = 30_000;
const LOGOUT_AFTER_MS = 10 * 60_000;
const WARNING_AFTER_MS = LOGOUT_AFTER_MS - 60_000;

// Client-only inactivity guard. It starts only after a successful login and
// deliberately ignores API/network activity.
export default function InactivityLogout({ active, onLogout }) {
  const lastActivityRef = useRef(0);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const loggedOutRef = useRef(false);
  const isIdleRef = useRef(false);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const clearTimers = useCallback(() => {
    window.clearTimeout(timeoutRef.current);
    window.clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  const logout = useCallback(() => {
    if (loggedOutRef.current) return;
    loggedOutRef.current = true;
    clearTimers();
    setShowWarning(false);
    onLogout?.();
  }, [clearTimers, onLogout]);

  const check = useCallback(() => {
    window.clearTimeout(timeoutRef.current);
    const elapsed = Date.now() - lastActivityRef.current;
    isIdleRef.current = elapsed >= IDLE_AFTER_MS;
    if (elapsed >= LOGOUT_AFTER_MS) {
      logout();
      return;
    }

    if (elapsed >= WARNING_AFTER_MS) {
      setShowWarning(true);
      setSecondsLeft(Math.max(1, Math.ceil((LOGOUT_AFTER_MS - elapsed) / 1000)));
      if (!intervalRef.current) intervalRef.current = window.setInterval(check, 1000);
    }

    const delay = elapsed < WARNING_AFTER_MS
      ? WARNING_AFTER_MS - elapsed
      : LOGOUT_AFTER_MS - elapsed;
    timeoutRef.current = window.setTimeout(check, Math.max(1, delay));
  }, [logout]);

  const recordActivity = useCallback(() => {
    if (!active || loggedOutRef.current) return;
    lastActivityRef.current = Date.now();
    isIdleRef.current = false;
    setShowWarning(false);
    clearTimers();
    check();
  }, [active, check, clearTimers]);

  useEffect(() => {
    if (!active) return undefined;
    loggedOutRef.current = false;
    lastActivityRef.current = Date.now();
    const events = ['pointerdown', 'keydown', 'touchstart', 'wheel'];
    events.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    check();

    return () => {
      clearTimers();
      events.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [active, check, clearTimers, recordActivity]);

  if (!active || !showWarning) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-3xl border border-sky-200/30 bg-gradient-to-br from-slate-800 to-blue-950 p-6 text-center text-white shadow-2xl">
        <h2 className="text-2xl font-extrabold">Still there?</h2>
        <p className="mt-3 text-sky-50">You’ll be logged out in {secondsLeft} second{secondsLeft === 1 ? '' : 's'}.</p>
        <button type="button" onClick={recordActivity} className="mt-6 rounded-xl bg-green-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-green-400">
          Stay Signed In
        </button>
      </div>
    </div>
  );
}
