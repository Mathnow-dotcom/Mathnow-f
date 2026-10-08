import React, { useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MathGameContext } from '../App.jsx';
import { assessmentCurrent, assessmentStart, assessmentUpdate } from '../api/mathApi.js';
import SessionTimer from './ui/SessionTimer.jsx';
import '../styles/Assessment.css';

export default function AssessmentScreen() {
  const ctx = useContext(MathGameContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [attempt, setAttempt] = useState(null);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savingNext, setSavingNext] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState('');
  const [quit, setQuit] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const session = useRef(crypto.randomUUID());
  const current = useRef(null);
  const alive = useRef(true);
  const locked = useRef(false);
  const queue = useRef(Promise.resolve());
  const pin = ctx.childPin;
  const beginKey = `math-assessment-begin-${pin}`;
  const draftKey = (a) => `math-assessment-draft-${pin}-${a.id}-${a.position}`;

  const apply = (a) => {
    if (!alive.current) return;
    current.current = a;
    setAttempt(a);
    setAnswer(a && !a.completed ? sessionStorage.getItem(draftKey(a)) || '' : '');
    if (a?.completed) localStorage.removeItem(beginKey);
  };
  // Serialize heartbeat/pause/answer traffic so a delayed response cannot replace a newer question.
  const enqueue = (work) => {
    const next = queue.current.catch(() => {}).then(work);
    queue.current = next;
    return next;
  };
  const update = (action, value) => enqueue(async () => {
    const a = current.current;
    if (!a || a.completed) return;
    const next = await assessmentUpdate(pin, a.id, { session: session.current, position: a.position, action, answer: value });
    if (action === 'answer') {
      sessionStorage.removeItem(draftKey(a));
      apply(next);
    }
  });

  useEffect(() => {
    alive.current = true;
    if (!ctx.isLoggedIn) return;
    let cancelled = false;
    assessmentCurrent(pin).then(({ attempt: a }) => {
      if (!cancelled) { apply(a); setLoaded(true); }
    }).catch(() => { if (!cancelled) { setError('Could not load your test. Please try again.'); setLoaded(true); } });
    return () => { cancelled = true; alive.current = false; };
  }, [pin, ctx.isLoggedIn]);

  useEffect(() => {
    if (!running || attempt?.completed) return;
    const fail = (e) => { if (alive.current) setError(e.message); };
    const checkpoint = () => {
      if (!document.hidden) update('heartbeat').catch(fail);
    };
    const visibility = () => {
      update(document.hidden ? 'pause' : 'heartbeat').catch(fail);
    };
    const pagehide = () => { update('pause').catch(() => {}); };
    const interval = window.setInterval(checkpoint, 5000);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', pagehide);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', pagehide);
      update('pause').catch(() => {});
    };
  }, [running, attempt?.completed, pin]);

  useEffect(() => {
    if (!attempt?.completed || !running) return;
    const timeout = setTimeout(() => navigate('/mode', { replace: true }), 5000);
    return () => clearTimeout(timeout);
  }, [attempt?.completed, running, navigate]);

  // Browser Back also leaves a persisted, resumable test rather than exposing previous items.
  useEffect(() => {
    if (pathname !== '/test-a' && running) {
      setRunning(false);
      if (current.current?.completed) apply(null);
    }
  }, [pathname, running]);

  const begin = async () => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    let key = localStorage.getItem(beginKey);
    if (!key) { key = crypto.randomUUID(); localStorage.setItem(beginKey, key); }
    try {
      const a = await enqueue(() => assessmentStart(pin, key, session.current));
      apply(a); setRunning(true);
    } catch (e) { setError(e.message); }
    finally { locked.current = false; setBusy(false); }
  };
  const edit = (value) => {
    const next = value.replace(/[^0-9]/g, '').slice(0, 10);
    setAnswer(next);
    if (attempt) sessionStorage.setItem(draftKey(attempt), next);
  };
  const submit = async (event) => {
    event.preventDefault();
    if (locked.current || !answer || document.hidden) return;
    locked.current = true; setBusy(true); setError('');
    const submitted = current.current;
    // Keep current.current at the confirmed position for ordered API traffic.
    // Only the display moves ahead; another answer cannot be submitted until this save is acknowledged.
    if (submitted?.nextProblem && submitted.position + 1 < submitted.count) {
      const preview = { ...submitted, position: submitted.position + 1, problem: submitted.nextProblem, nextProblem: null };
      // Commit the question and input reset during the click itself, before starting network work.
      flushSync(() => {
        setAttempt(preview);
        setAnswer(sessionStorage.getItem(draftKey(preview)) || '');
        setSavingNext(true);
      });
    }
    try { await update('answer', answer); }
    catch (e) { apply(submitted); setError(e.message); }
    finally { locked.current = false; setBusy(false); setSavingNext(false); }
  };
  const leave = async () => {
    if (locked.current) return;
    locked.current = true; setBusy(true);
    try { await update('pause'); }
    catch { setError('Could not sync the latest timing. Your test will resume from the last saved answer.'); }
    finally {
      locked.current = false; setBusy(false); setRunning(false); setQuit(false); navigate('/mode');
    }
  };

  if (!ctx.isLoggedIn) return <Navigate to={ctx.isQuittingRef?.current ? '/' : '/name'} replace />;
  const complete = running && attempt?.completed;
  const learnRoute = ctx.userSavedThemeKey && ctx.userSavedThemeKey !== 'null' ? '/operations' : '/theme';
  const isSelectionPage = pathname === '/mode' || pathname === '/test-selection';
  return (
    <main className={`assessment-page${isSelectionPage ? ' assessment-selection-page' : ''}`}>
      <header className="assessment-toolbar assessment-student-toolbar">
        {running && !complete
          ? <button type="button" onClick={() => setQuit(true)}>⚙ Quit test</button>
          : <button type="button" onClick={ctx.handleQuit}>Sign out</button>}
      </header>
      <section className={`assessment-card${isSelectionPage ? ' assessment-selection-card' : ''}${running && !complete ? ' assessment-question-card' : ''}`} aria-busy={busy}>
        {pathname === '/mode' ? <>
          {/* <h1>What would you like to do?</h1>         */}
          <div className="assessment-choices assessment-mode-choices">
            <button onClick={() => navigate(learnRoute)}>LEARN</button>
            <button onClick={() => navigate('/test-selection')}>TAKE A TEST</button>
          </div>
        </> : pathname === '/test-selection' ? <>         
          <div className="assessment-choices">
            <button onClick={() => navigate('/test-a')}>Addition</button>
          </div>
          <button className="assessment-secondary" onClick={() => navigate('/mode')}>Back</button>
        </> : complete ? <>
          <h1 role="status">Test complete</h1><p>Returning to your activity choices…</p>
        </> : !running ? <>
          <h1>Addition</h1>
          <p>Your time is recorded from Begin. You can quit and resume your unfinished test later.</p>
          {attempt && <p>Saved progress: {attempt.position} of {attempt.count} questions answered.</p>}
          <button disabled={busy || !loaded} onClick={begin}>{busy ? 'Loading…' : attempt ? 'Resume test' : 'Begin'}</button>
          <button className="assessment-secondary" disabled={busy} onClick={() => navigate('/test-selection')}>Back</button>
        </> : <>
          {/* <p>Question {attempt.position + 1} of {attempt.count}</p> */}
          <h1 className="assessment-problem">{attempt.problem}</h1>
          <form onSubmit={submit}>
            <label className="sr-only" htmlFor="test-answer">Your answer</label>
            <input key={attempt.position} id="test-answer" autoFocus inputMode="none" pattern="[0-9]*" autoComplete="off"
              value={answer} onChange={(e) => edit(e.target.value)} disabled={(busy && !savingNext) || quit} placeholder="Type answer" />
            <div className="assessment-keypad">
              {[1,2,3,4,5,6,7,8,9,'Clear',0].map(key => <button type="button" key={key} className={key === 'Clear' ? 'assessment-clear' : undefined} disabled={(busy && !savingNext) || quit}
                onClick={() => edit(key === 'Clear' ? '' : answer + key)}>{key}</button>)}
              <button type="submit" className={answer ? 'assessment-submit' : 'assessment-submit assessment-submit--empty'}
                disabled={busy || quit || !answer}>Submit</button>
            </div>
          </form>
        </>}
        {error && <div role="alert" className="assessment-error">{error}
          {running && !complete && <button disabled={busy} onClick={begin}>Resume here</button>}
        </div>}
      </section>
      {quit && <div className="assessment-modal" role="dialog" aria-modal="true" aria-label="Quit test">
        <section className="assessment-card"><h2>Leave this test?</h2><p>Your saved answers will be here when you return.</p>
          <button disabled={busy} onClick={leave}>Save &amp; return to mode</button>
          <button className="assessment-secondary" disabled={busy} onClick={() => setQuit(false)}>Keep going</button>
          {error && <p role="alert">{error}</p>}
        </section>
      </div>}
      <aside className="assessment-timer"><SessionTimer accumulatedTime={ctx.totalTimeToday} /></aside>
    </main>
  );
}
