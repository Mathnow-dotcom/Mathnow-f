import React, { useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { MathGameContext } from '../App.jsx';
import SessionTimer from './ui/SessionTimer.jsx';
import '../styles/Assessment.css';

export default function AssessmentSelection({ tests = false }) {
  const ctx = useContext(MathGameContext);
  const navigate = useNavigate();
  if (!ctx.isLoggedIn) return <Navigate to="/name" replace />;
  return <main className="assessment-page assessment-selection-page">
    <header className="assessment-toolbar assessment-student-toolbar">
      <button type="button" onClick={ctx.handleQuit}>Sign out</button>
    </header>
    <section className="assessment-card assessment-selection-card">
      <div className={`assessment-choices${tests ? '' : ' assessment-mode-choices'}`}>
        {tests ? [['a', 'Addition'], ['b', 'Subtraction'], ['c', 'Multiplication'], ['d', 'Division']].map(([type, label]) =>
          <button key={type} onClick={() => navigate(`/legacy-test-${type}`)}>{label}</button>) : <>
          <button onClick={() => navigate('/operations')}>LEARN</button>
          <button onClick={() => navigate('/test-selection')}>TAKE A TEST</button>
        </>}
      </div>
      {tests && <button className="assessment-secondary" onClick={() => navigate('/mode')}>Back</button>}
    </section>
    <aside className="assessment-timer"><SessionTimer accumulatedTime={ctx.totalTimeToday} /></aside>
  </main>;
}
