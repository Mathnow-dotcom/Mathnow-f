import React, { useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MathGameContext } from '../App.jsx';
import { assessmentStart, assessmentUpdate, programProgress } from '../api/mathApi.js';
import SessionTimer from './ui/SessionTimer.jsx';
import '../styles/Assessment.css';

export default function AssessmentScreen({ flow = 'learning', type, part = null }) {
  const ctx = useContext(MathGameContext);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const testType = type || (pathname === '/test-d' ? 'D' : pathname === '/test-c' ? 'C' : pathname === '/test-b' ? 'B' : 'A');
  const legacy = flow === 'legacy';
  const returnPath = legacy ? '/test-selection' : '/operations';
  const [attempt, setAttempt] = useState(null);
  const [additionPart, setAdditionPart] = useState(null);
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
  const beginKey = useRef(crypto.randomUUID());
  const ended = useRef(false);
  const draftKey = (a) => `math-assessment-draft-${pin}-${a.id}-${a.position}`;

  const apply = (a) => {
    if (!alive.current) return;
    current.current = a;
    setAttempt(a);
    setAnswer(a && !a.completed ? sessionStorage.getItem(draftKey(a)) || '' : '');
    if (a?.abandoned) { ended.current = true; setRunning(false); setError("This test has ended. Start a new test."); beginKey.current = crypto.randomUUID(); }
  };
  // Serialize heartbeat/end/answer traffic so a delayed response cannot replace a newer question.
  const enqueue = (work) => {
    const next = queue.current.catch(() => {}).then(work);
    queue.current = next;
    return next;
  };
  const update = (action, value) => enqueue(async () => {
    const a = current.current;
    if (!a || a.completed || a.abandoned) return;
    const next = await assessmentUpdate(pin, a.id, { session: session.current, position: a.position, action, answer: value });
    if (action === 'answer' || next.abandoned) {
      sessionStorage.removeItem(draftKey(a));
      apply(next);
    }
  });

  useEffect(() => {
    alive.current = true;
    if (!ctx.isLoggedIn) return;
    let cancelled = false;
    setAdditionPart(part);
    if (testType === 'A' && !legacy) programProgress(pin).then(p => {
      if (!cancelled && p.subject === 'add') setAdditionPart(p.part || null);
    }).catch(() => {}); // Label only; eligibility remains enforced by Start.
    setLoaded(true);
    return () => { cancelled = true; alive.current = false; };
  }, [pin, ctx.isLoggedIn, testType, flow, part]);

  // Send immediately on navigation/unload; do not wait for queued heartbeats.
  const endOnExit = () => {
    const a = current.current;
    if (!a || a.completed || a.abandoned || ended.current) return;
    ended.current = true;
    assessmentUpdate(pin, a.id, { session: session.current, position:a.position, action:'end' }).catch(() => {});
  };
  useEffect(() => {
    const hide = () => { endOnExit(); };
    const restore = event => { if (event.persisted) window.location.reload(); };
    window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', restore);
    return () => {
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('pageshow', restore);
      endOnExit();
    };
  }, [pin]);
  useEffect(() => {
    if (!running || attempt?.completed) return;
    const interval = window.setInterval(() => {
      if (!document.hidden && !ended.current) update('heartbeat').catch(e => { if (alive.current) setError(e.message); });
    }, 5000);
    return () => clearInterval(interval);
  }, [running, attempt?.completed, pin]);

  useEffect(() => {
    if (!attempt?.completed || !running) return;
    const timeout = setTimeout(() => navigate(returnPath, { replace: true }), 5000);
    return () => clearTimeout(timeout);
  }, [attempt?.completed, running, navigate, returnPath]);

  // Navigation leaves the attempt ended rather than resumable.
  useEffect(() => {
    if (!['/test-a', '/test-b', '/test-c', '/test-d', '/legacy-test-a', '/legacy-test-a-part-1', '/legacy-test-a-part-2', '/legacy-test-b', '/legacy-test-c', '/legacy-test-d'].includes(pathname) && running) {
      setRunning(false);
      if (current.current?.completed) apply(null);
    }
  }, [pathname, running]);

  const begin = async () => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    const key = beginKey.current;
    ended.current = false;
    try {
      const a = await enqueue(() => assessmentStart(pin, key, session.current, testType, flow, part));
      if (!alive.current || ended.current) {
        await assessmentUpdate(pin, a.id, {session:session.current, position:a.position, action:'end'});
        return;
      }
      apply(a); if (!a.abandoned) setRunning(true);
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
    try { await update('end'); ended.current = true; }
    catch { endOnExit(); }
    finally {
      locked.current = false; setBusy(false); setRunning(false); setQuit(false); navigate(legacy ? '/mode' : returnPath);
    }
  };

  if (!ctx.isLoggedIn) return <Navigate to={ctx.isQuittingRef?.current ? '/' : '/name'} replace />;
  const complete = running && attempt?.completed;
  return (
    <main className="assessment-page">
      <header className="assessment-toolbar assessment-student-toolbar">
        {running && !complete
          ? <button type="button" onClick={() => setQuit(true)}>⚙ Quit test</button>
          : <button type="button" onClick={ctx.handleQuit}>Sign out</button>}
      </header>
      <section className={`assessment-card${!running ? ' assessment-start-card' : ''}${running && !complete ? ' assessment-question-card' : ''}`} aria-busy={busy}>
        {complete ? <>
          <h1 role="status">Test complete</h1><p>{legacy ? 'Returning to tests…' : 'Returning to your subjects…'}</p>
        </> : !running ? <>
          <h1>{{ A: 'Addition', B: 'Subtraction', C: 'Multiplication', D: 'Division' }[testType]}{testType === 'A' && (attempt ? attempt.part : additionPart) ? ` — Part ${attempt ? attempt.part : additionPart}` : ''}</h1>
          <p>This is a timed test.</p>
          <div className="assessment-card-actions">
          <button disabled={busy || !loaded} onClick={begin}>{busy ? 'Loading…' : 'Start'}</button>
          <button className="assessment-secondary" disabled={busy} onClick={() => navigate(returnPath)}>Back</button>
          </div>
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
        {error && <div role="alert" className="assessment-error">{error}</div>}
      </section>
      {quit && <div className="assessment-modal" role="dialog" aria-modal="true" aria-label="Quit test">
        <section className="assessment-card assessment-quit-card">
          <span className="assessment-card-symbol" aria-hidden="true">Ⅱ</span>
          <div className="assessment-card-actions">
          <button disabled={busy} onClick={leave}>End test</button>
          <button className="assessment-secondary" disabled={busy} onClick={() => setQuit(false)}>Keep going</button>
          </div>
          {error && <p role="alert">{error}</p>}
        </section>
      </div>}
      <aside className="assessment-timer"><SessionTimer accumulatedTime={ctx.totalTimeToday} /></aside>
    </main>
  );
}
