import CorrectionTransition from './CorrectionTransition.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { correctionAction, correctionState, mapQuestionToFrontend } from '../api/mathApi.js';

// Only active thinking time counts. Network saves, answer displays and time away do not.
export default function CorrectionLoop({ runId, pin, paused, onComplete }) {
  const [state, setState] = useState(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const live = useRef(true), current = useRef(null), lock = useRef(false), started = useRef(null);
  const pending = useRef(null), finish = useRef(onComplete), completing = useRef(false);
  finish.current = onComplete;
  const apply = value => {
    current.current = value;
    started.current = null;
    if (live.current) { setState(value); setInput(''); }
  };
  const elapsed = () => started.current == null ? 0 : Math.max(0, Math.round(performance.now() - started.current));
  const send = async (action, answer) => {
    if (lock.current || !current.current) return;
    lock.current = true; setBusy(true); setError('');
    const c = current.current;
    const body = pending.current || { id:c.id, revision:c.revision, action, answer, responseMs:elapsed() };
    pending.current = body;
    started.current = null;
    try {
      const next = await correctionAction(runId,pin,body);
      pending.current = null; apply(next);
    } catch (e) { if (live.current) setError(e.message || 'Could not save. Please retry.'); }
    finally { lock.current=false; if (live.current) setBusy(false); }
  };
  useEffect(() => {
    live.current=true;
    let cancelled = false;
    correctionState(runId,pin).then(value => { if (!cancelled) apply(value); }).catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled=true; live.current=false; };
  }, [runId,pin]);
  useEffect(() => {
    if (!state || state.phase !== 'practice' || busy || error) return;
    if (paused || document.hidden) {
      if (started.current != null) send('pause');
      return;
    }
    started.current = performance.now();
    const timeout = setTimeout(() => send('timeout'), Math.max(1,state.limitMs-state.elapsedMs+1));
    const pause = () => { if (document.hidden) send('pause'); };
    const resume = () => {
      if (!document.hidden && !lock.current) setState(s => s ? {...s} : s);
    };
    const leave = () => send('pause');
    window.addEventListener('pagehide',leave);
    document.addEventListener('visibilitychange',pause);
    document.addEventListener('visibilitychange',resume);
    return () => { window.removeEventListener('pagehide',leave); clearTimeout(timeout); document.removeEventListener('visibilitychange',pause); document.removeEventListener('visibilitychange',resume); };
  }, [state,busy,error,paused]);
  useEffect(() => {
    if (!state || !['passed','finished'].includes(state.phase) || completing.current) return;
    completing.current=true;
    Promise.resolve(finish.current()).catch(e => {
      completing.current=false; if (live.current) setError(e.message || 'Could not resume. Please retry.');
    });
  }, [state]);
  const retry = () => {
    setError('');
    if (pending.current) send(pending.current.action);
    else if (state) setState({...state});
    else correctionState(runId,pin).then(apply).catch(e => setError(e.message));
  };
  const q = state?.question ? mapQuestionToFrontend(state.question) : null;
  const shown = state?.phase === 'answer';
  const reverse = Array.isArray(state?.question?.textChoices) && state.question.textChoices.length > 0;
  const displayAnswer = q?.answerLabels?.[q.correctAnswer] ?? q?.correctAnswer;
  const submit = e => {
    e.preventDefault();
    if (!input || busy || paused || document.hidden || error) return;
    const value = Number(input);
    if (!Number.isFinite(value)) return;
    send('answer', Number.isFinite(q?.answerScale)
      ? String(value) === String(displayAnswer) ? q.correctAnswer : Math.round(value*q.answerScale)
      : value);
  };
  if (!q || ['passed','finished'].includes(state?.phase))
    return <CorrectionTransition error={error} onRetry={retry} busy={busy} />;
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto p-4" style={{background:"#082338 url('/night_sky_landscape.jpg') center / cover"}}>
    <section className={`bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 rounded-3xl shadow-2xl my-auto shrink-0 p-6 sm:p-8 w-full ${shown ? 'max-w-2xl' : 'max-w-md'}`}>
      {shown ? <>
        <div className="font-bold text-green-600 mb-6 text-center text-[clamp(2rem,8vw,5rem)]">{q.question.replace(/\s*=\s*\?\s*$/, '')} = {displayAnswer}</div>
        <div className="text-center"><button disabled={busy || paused || !!error} onClick={() => send('next')}
          className="bg-green-600 text-white font-bold py-2 px-8 rounded-xl shadow-lg disabled:cursor-default">Next</button></div>
      </> : state.phase === 'practice' && reverse ? <>
        <div className="text-5xl font-extrabold text-green-600 text-center mb-6">{q.question}</div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {state.question.textChoices.map((expression, index) => <button key={index} type="button"
            disabled={busy || paused || !!error}
            onClick={() => { if (!document.hidden) send('answer', index); }}
            className="bg-gray-100 text-gray-800 font-bold text-xl sm:text-2xl min-h-16 py-4 px-2 rounded-xl shadow-md disabled:cursor-default">
            {expression.replace(/\s*=\s*\?\s*$/, '')}
          </button>)}
        </div>
      </> : state.phase === 'practice' ? <form onSubmit={submit}>
        <div className="text-5xl font-extrabold text-green-600 text-center mb-6">{q.question}</div>
        <input aria-label="Correction answer" inputMode="none" autoComplete="off" value={input}
          onChange={e => setInput(e.target.value.replace(Number.isFinite(q.answerScale) ? /[^0-9.]/g : /[^0-9]/g,'').slice(0,10))}
          disabled={busy || paused || !!error} placeholder="Type answer"
          className="w-full h-24 bg-white rounded-2xl border-4 border-green-300 text-center text-4xl font-bold mb-5 text-gray-800" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3,4,5,6,7,8,9,'Clear',0,...(Number.isFinite(q.answerScale) ? ['.'] : [])].map(n =>
            <button key={n} type="button" disabled={busy || paused || !!error}
              onClick={() => setInput(v => n === 'Clear' ? '' : n === '.' && v.includes('.') ? v : (v+n).slice(0,10))}
              className="bg-gray-100 text-gray-800 font-bold text-2xl py-2 rounded-xl shadow-md disabled:cursor-default">{n}</button>)}
          <button disabled={busy || paused || !input || !!error} className={`font-bold py-2 rounded-xl shadow-md disabled:cursor-default ${input ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-800'}`}>Submit</button>
        </div>
      </form> : null}
      {error && <div role="alert" className="text-red-700 mt-4">{error} <button onClick={retry} disabled={busy}>Retry</button></div>}
    </section>
  </div>;
}
