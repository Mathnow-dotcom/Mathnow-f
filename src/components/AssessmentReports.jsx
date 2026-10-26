import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { assessmentReports, assessmentExport, programReports } from '../api/mathApi.js';
import '../styles/Assessment.css';

const subjectNames = { add: 'Addition', sub: 'Subtraction', mul: 'Multiplication', div: 'Division', completed: 'Completed' };

const duration = (ms) => {
  const seconds = Math.round(ms / 1000);
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
};
const queryDates = ({ student, type, from, to }) => {
  const result = { student: student.trim(), type };
  if (from) result.from = new Date(`${from}T00:00:00`).toISOString();
  if (to) {
    const end = new Date(`${to}T00:00:00`);
    end.setDate(end.getDate() + 1);
    result.to = end.toISOString();
  }
  return result;
};

export default function AssessmentReports() {
  const navigate = useNavigate();
  const pin = localStorage.getItem('math-admin-pin');
  const [filters, setFilters] = useState({ student: '', type: '', from: '', to: '' });
  const [query, setQuery] = useState({});
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [program, setProgram] = useState(null);
  useEffect(() => {
    let cancelled = false;
    if (pin) programReports(pin, query.student).then(p => { if (!cancelled) setProgram(p); })
      .catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [pin, query.student]);
  useEffect(() => {
    if (!pin) return;
    let ignore = false;
    setBusy(true); setError(''); setRows([]);
    assessmentReports(pin, { ...query, page }).then(data => { if (!ignore) setRows(data); })
      .catch(e => { if (!ignore) setError(e.message); })
      .finally(() => { if (!ignore) setBusy(false); });
    return () => { ignore = true; };
  }, [pin, query, page]);
  const download = async () => {
    setExporting(true); setError('');
    try {
      const blob = await assessmentExport(pin, query);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'mathnow-test-results.csv';
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setError(e.message); }
    finally { setExporting(false); }
  };
  if (!pin) return <Navigate to="/" replace />;
  return <main className="assessment-page">
    <header className="assessment-toolbar"><h1 className="text-2xl font-bold">Test Results</h1>
      <button onClick={() => navigate('/admin-dashboard')}>Student Stats</button></header>
    <section className="assessment-report">
      <p className="mb-6">Assessment history and learning progression.</p>
      {program && <section className="assessment-results">
        <h2>Program progress</h2>
        <p>Passes: {program.passes} · Failures: {program.failures} · Pass rate: {program.passRate?.toFixed(1)}%
          {' · '}Interventions: {program.statuses?.INTERVENTION_REQUIRED || 0} ({(program.interventionRate || 0).toFixed(1)}%)</p>
        <p>{Object.entries(program.modules || {}).map(([op, count]) => `${subjectNames[op] || op}: ${count} (${(program.moduleRates?.[op] || 0).toFixed(1)}%)`).join(' · ')}</p>
        <table><thead><tr><th>Student</th><th>Subject</th><th>Level</th><th>Batch</th><th>Status</th><th>Details</th></tr></thead>
          <tbody>{program.students?.map(s => <tr key={s.pin}>
            <td>{s.student} #{s.pin}</td><td>{subjectNames[s.subject] || 'Completed'}</td><td>{s.level || '—'}</td><td>{s.batch || '—'}</td>
            <td>{s.status.replaceAll('_', ' ')}</td><td><details><summary>Progress</summary>
              {s.migrationPending && <p>Migration preview — existing progress unchanged.</p>}
              {['add','sub','mul','div'].map(op => <p key={op}>{subjectNames[op]}: {s.subjects[op]?.status?.replaceAll('_', ' ') || (s.grandfatheredAccess.includes(op) ? 'Legacy access' : 'Locked')}
                {' · '}Completed levels: {s.completedLevels?.[op]?.join(', ') || '—'}</p>)}
            </details></td>
          </tr>)}</tbody></table>
      </section>}
      <form className="assessment-filters" onSubmit={e => {
        e.preventDefault();
        if (filters.from && filters.to && filters.from > filters.to) { setError('Start date must be before end date.'); return; }
        setPage(0); setQuery(queryDates(filters));
      }}>
        <label>Student PIN<input value={filters.student} onChange={e => setFilters({ ...filters, student: e.target.value })} /></label>
        <label>Test<select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All tests</option><option value="A">Test A — Addition</option><option value="B">Test B — Subtraction</option><option value="C">Test C — Multiplication</option><option value="D">Test D — Division</option></select></label>
        <label>From<input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} /></label>
        <label>To<input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} /></label>
        <button disabled={busy}>Apply filters</button>
        <button type="button" disabled={exporting || busy} onClick={download}>{exporting ? 'Exporting…' : 'Export CSV'}</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {busy ? <p role="status">Loading results…</p> : <div className="assessment-results">
        {rows.length === 0 ? <p>No completed tests found.</p> : <table><thead><tr>
          <th>Student</th><th>Test</th><th>Batch / attempt</th><th>Result</th><th>Completed</th><th>Accuracy</th><th>Total time</th>
          <th>Average time per item</th><th title="Percentage of all test items answered correctly in less than 2 seconds">Correct under 2 seconds</th>
          <th title="Percentage of all test items answered correctly in less than 3 seconds">Correct under 3 seconds</th><th>Per-item detail</th>
        </tr></thead><tbody>{rows.map(row => <tr key={row.id}>
          <td>{row.student}<br /><small>#{row.pin}</small></td><td>{row.type}</td>
          <td>{row.batch ?? 'Legacy'}</td><td>{row.passed == null ? 'Legacy' : row.passed ? 'Pass' : 'Fail'}</td>
          <td>{new Date(row.completedAt).toLocaleString()}</td>
          <td>{row.percent.toFixed(1)}%</td><td>{duration(row.totalMs)}</td>
          <td>{Number.isFinite(row.averageTimeMs) ? `${(row.averageTimeMs / 1000).toFixed(2)} s` : '—'}</td>
          <td>{Number.isFinite(row.correctUnderTwoSecondsPercent) ? `${row.correctUnderTwoSecondsPercent.toFixed(1)}%` : '—'}</td>
          <td>{Number.isFinite(row.correctUnderThreeSecondsPercent) ? `${row.correctUnderThreeSecondsPercent.toFixed(1)}%` : '—'}</td>
          <td><details><summary>View {row.count} items</summary><table><thead><tr>
            <th>Problem</th><th>Answer</th><th>Result</th><th>Time</th><th title="Time the server accepted the answer, in your device timezone">Answered at</th>
          </tr></thead><tbody>{row.answers.map((a, i) => <tr key={i}><td>{a.problem}</td><td>{a.answer}</td>
            <td>{a.correct ? 'Correct' : 'Incorrect'}</td><td>{duration(a.timeMs)}</td>
            <td>{a.answeredAt ? new Date(a.answeredAt).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Not recorded'}</td></tr>)}</tbody></table></details></td>
        </tr>)}</tbody></table>}
      </div>}
      <div className="assessment-toolbar mt-6">
        <button disabled={busy || page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Page {page + 1}</span><button disabled={busy || rows.length < 25} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </section>
  </main>;
}
