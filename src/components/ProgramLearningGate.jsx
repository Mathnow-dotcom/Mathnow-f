import React, { cloneElement, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MathGameContext } from '../App.jsx';
import { programProgress } from '../api/mathApi.js';

export default function ProgramLearningGate({ children }) {
  const ctx = useContext(MathGameContext);
  const location = useLocation();
  const navigate = useNavigate();
  // Consume the fresh Operations check once. Do not cache it across later visits,
  // assessment completion, account changes, or direct/reloaded URLs.
  const [entry] = useState(() => {
    const value = location.state?.programEntry;
    return value?.pin === ctx.childPin && value.operation === ctx.selectedOperation
      && Date.now() - value.checkedAt < 10000 ? value : null;
  });
  const [state, setState] = useState(entry?.program || null);
  const [error, setError] = useState('');
  const managed = ['add','sub','mul','div'].includes(ctx.selectedOperation);
  useEffect(() => {
    let cancelled = false;
    setError('');
    if (entry && entry.pin === ctx.childPin && entry.operation === ctx.selectedOperation) {
      if (location.state?.programEntry) {
        const { programEntry, ...rest } = location.state;
        navigate(location.pathname + location.search, { replace: true, state: rest });
      }
      return;
    }
    setState(null);
    if (managed && ctx.isLoggedIn) programProgress(ctx.childPin)
      .then(p => { if (!cancelled) setState(p); })
      .catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [ctx.childPin, ctx.selectedOperation, ctx.isLoggedIn, managed]);
  if (!managed) return children;
  if (error || !state) return <div className="min-h-screen flex items-center justify-center text-white"
    style={{ background: "#082338 url('/night_sky_landscape.jpg') center / cover" }}>
    <p role={error ? 'alert' : 'status'}>{error || 'Loading…'}</p>
  </div>;
  if (state.subject === ctx.selectedOperation && state.status !== 'LEARNING')
    return <Navigate to="/operations" replace />;
  if (!state.subjects[ctx.selectedOperation] && !state.grandfatheredAccess.includes(ctx.selectedOperation))
    return <Navigate to="/operations" replace />;
  return cloneElement(children, { programLevel: state.subject === ctx.selectedOperation ? state.level : null });
}
