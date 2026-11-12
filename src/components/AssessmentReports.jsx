import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  assessmentReports,
  assessmentExport,
  getAdminStats,
  programReports,
} from '../api/mathApi.js';
import {
  FaChartLine,
  FaClock,
  FaCog,
  FaDownload,
  FaSignOutAlt,
  FaTrophy,
  FaUsers,
} from 'react-icons/fa';
import '../styles/Assessment.css';
import AdminBrand from './admin/AdminBrand.jsx';

const subjectNames = { add: 'Addition', sub: 'Subtraction', mul: 'Multiplication', div: 'Division', frac: 'Fractions to Decimals', completed: 'Completed' };

const duration = (ms) => {
  const seconds = Math.round(ms / 1000);
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
};
const compactDuration = (ms) => {
  const totalMinutes = Math.round((Number(ms) || 0) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};
const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
  const [showProgram, setShowProgram] = useState(false);
  const [programError, setProgramError] = useState('');
  const [summary, setSummary] = useState({
    totalStudents: 0,
    totalTimeMs: 0,
    totalScore: 0,
    loggedInToday: 0,
  });
  useEffect(() => {
    let cancelled = false;
    if (!pin) return undefined;
    getAdminStats(pin, 1000, 0)
      .then((response) => {
        if (cancelled) return;
        const students = Array.isArray(response?.data) ? response.data : [];
        const totalCount = Number(response?.pagination?.totalCount);
        setSummary({
          totalStudents: Number.isFinite(totalCount) ? totalCount : students.length,
          totalTimeMs: students.reduce((sum, student) => sum + toNumber(student?.grandTotalActiveMs), 0),
          totalScore: students.reduce((sum, student) => sum + toNumber(student?.grandTotalCorrect), 0),
          loggedInToday: students.reduce((sum, student) => sum + (student?.loggedInToday ? 1 : 0), 0),
        });
      })
      .catch(() => {
        // Test reporting still works if dashboard summary metrics are unavailable.
      });
    return () => { cancelled = true; };
  }, [pin]);
  useEffect(() => {
    let cancelled = false;
    if (!showProgram) return;
    setProgram(null); setProgramError('');
    if (pin) programReports(pin, query.student).then(p => { if (!cancelled) setProgram(p); })
      .catch(e => { if (!cancelled) setProgramError(e.message); });
    return () => { cancelled = true; };
  }, [pin, query.student, showProgram]);
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
  const logout = () => {
    localStorage.removeItem('math-admin-pin');
    navigate('/name', { replace: true });
  };
  return <main className="assessment-page admin-classroom-page admin-reports-page">
    <header className="admin-reports-header">
      <div className="admin-reports-heading">
        <AdminBrand />
        <div className="admin-reports-title-row">
          <span className="admin-reports-title-icon" aria-hidden="true"><FaChartLine /></span>
          <h1>Test Results</h1>
        </div>
      </div>
      <nav className="admin-reports-nav" aria-label="Test results navigation">
        <button type="button" className="admin-reports-nav__logout" onClick={logout}>
          <FaSignOutAlt aria-hidden="true" /> Logout
        </button>
        <div className="admin-reports-nav__secondary">
          <button type="button" onClick={() => navigate('/admin-dashboard')}>
            <FaChartLine aria-hidden="true" /> Student Stats
          </button>
          <button type="button" onClick={() => navigate('/admin-settings')}>
            <FaCog aria-hidden="true" /> App Settings
          </button>
        </div>
      </nav>
    </header>

    <section className="admin-reports-summary" aria-label="Admin summary">
      <article className="admin-reports-summary__card">
        <span className="admin-reports-summary__icon is-blue"><FaUsers /></span>
        <div><strong>{summary.totalStudents}</strong><span>Total Students</span></div>
      </article>
      <article className="admin-reports-summary__card">
        <span className="admin-reports-summary__icon is-green"><FaClock /></span>
        <div><strong>{compactDuration(summary.totalTimeMs)}</strong><span>Total Time</span></div>
      </article>
      <article className="admin-reports-summary__card">
        <span className="admin-reports-summary__icon is-amber"><FaTrophy /></span>
        <div><strong>{summary.totalScore}</strong><span>Total Score</span></div>
      </article>
      <article className="admin-reports-summary__card">
        <span className="admin-reports-summary__icon is-violet"><FaChartLine /></span>
        <div><strong>{summary.loggedInToday}</strong><span>Students Logged In Today</span></div>
      </article>
    </section>

    <section className="assessment-report">
      <form className="assessment-filters" onSubmit={e => {
        e.preventDefault();
        if (filters.from && filters.to && filters.from > filters.to) { setError('Start date must be before end date.'); return; }
        setPage(0); setQuery(queryDates(filters));
      }}>
        <label>Student PIN<input value={filters.student} onChange={e => setFilters({ ...filters, student: e.target.value })} /></label>
        <label>Test<select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All tests</option><option value="A">Test A — Addition</option><option value="B">Test B — Subtraction</option><option value="C">Test C — Multiplication</option><option value="D">Test D — Division</option></select></label>
        <label>From (started)<input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} /></label>
        <label>To (started)<input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} /></label>
        <button className="assessment-filter-apply" disabled={busy}>Apply filters</button>
        <button className="assessment-filter-export" type="button" disabled={exporting || busy} onClick={download}>
          <FaDownload aria-hidden="true" /> {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {busy ? <p role="status">Loading results…</p> : <div className="assessment-results">
        {rows.length === 0 ? <p>No tests found.</p> : <table><thead><tr>
          <th>#</th><th>Student</th><th>Test</th><th>Batch / attempt</th><th>Result</th><th>Status</th><th>Answered</th><th>Started</th><th>Completed / ended</th><th>Accuracy</th><th>Total time</th>
          <th>Average time per item</th><th title="Percentage of all test items answered correctly in less than 2 seconds">Correct under 2 seconds</th>
          <th title="Percentage of all test items answered correctly in less than 3 seconds">Correct under 3 seconds</th><th>Per-item detail</th>
        </tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={row.id}>
          <td className="assessment-row-number">{page * 25 + rowIndex + 1}</td>
          <td><span className="assessment-student-cell"><span className="assessment-student-avatar">{String(row.student || '?').charAt(0).toUpperCase()}</span><span>{row.student}<small>#{row.pin}</small></span></span></td><td>{row.type}{row.part ? ` — Part ${row.part}` : ''}</td>
          <td>{row.partBatch ?? row.batch ?? 'HIGH STAKES TEST'}</td><td><span className={`assessment-result-badge ${row.passed == null ? 'is-neutral' : row.passed ? 'is-pass' : 'is-fail'}`}>{row.passed == null ? '—' : row.passed ? 'Pass' : 'Fail'}</span></td>
          <td>{row.status || 'Completed'}</td><td>{row.answered ?? row.answers.length} / {row.count}</td>
          <td>{row.startedAt ? new Date(row.startedAt).toLocaleString() : '—'}</td>
          <td>{row.completedAt || row.endedAt ? new Date(row.completedAt || row.endedAt).toLocaleString() : '—'}</td>
          <td><span className="assessment-metric-pill is-accuracy">{row.percent.toFixed(1)}%</span></td><td>{duration(row.totalMs)}</td>
          <td>{Number.isFinite(row.averageTimeMs) ? `${(row.averageTimeMs / 1000).toFixed(2)} s` : '—'}</td>
          <td><span className="assessment-metric-pill is-fast">{Number.isFinite(row.correctUnderTwoSecondsPercent) ? `${row.correctUnderTwoSecondsPercent.toFixed(1)}%` : '—'}</span></td>
          <td><span className="assessment-metric-pill is-three">{Number.isFinite(row.correctUnderThreeSecondsPercent) ? `${row.correctUnderThreeSecondsPercent.toFixed(1)}%` : '—'}</span></td>
          <td><details><summary>View {row.count} items</summary><table><thead><tr>
            <th>Problem</th><th>Answer</th><th>Result</th><th>Time</th><th title="Time the server accepted the answer, in your device timezone">Answered at</th>
          </tr></thead><tbody>{(row.items || row.answers.map(a => a.problem)).map((problem, i) => { const a = row.answers[i]; return <tr key={i}><td>{problem}</td><td>{a?.answer ?? '—'}</td>
            <td>{!a ? 'Not answered' : a.correct ? 'Correct' : 'Incorrect'}</td><td>{a ? duration(a.timeMs) : '—'}</td>
            <td>{a?.answeredAt ? new Date(a.answeredAt).toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Not recorded'}</td></tr>; })}</tbody></table></details></td>
        </tr>)}</tbody></table>}
      </div>}
      <div className="assessment-toolbar mt-6">
        <button disabled={busy || page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Page {page + 1}</span><button disabled={busy || rows.length < 25} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
      <details className="mt-6" onToggle={e => {
        if (e.target === e.currentTarget) setShowProgram(e.currentTarget.open);
      }}>
        <summary>Program progress (student summary)</summary>
        <p>This summary uses the Student PIN filter only.</p>
        {programError && <p role="alert">{programError}</p>}
        {showProgram && !program && !programError && <p role="status">Loading program progress…</p>}
      {program && <section className="assessment-results">
        <h2>Program progress</h2>
        <p>Passes: {program.passes} · Failures: {program.failures} · Pass rate: {program.passRate?.toFixed(1)}%
          {' · '}Interventions: {program.statuses?.INTERVENTION_REQUIRED || 0} ({(program.interventionRate || 0).toFixed(1)}%)</p>
        <p>{Object.entries(program.modules || {}).map(([op, count]) => `${subjectNames[op] || op}: ${count} (${(program.moduleRates?.[op] || 0).toFixed(1)}%)`).join(' · ')}</p>
        <table><thead><tr><th>Student</th><th>Subject</th><th>Level</th><th>Batch</th><th>Status</th><th>Details</th></tr></thead>
          <tbody>{program.students?.map(s => <tr key={s.pin}>
            <td>{s.student} #{s.pin}</td><td>{subjectNames[s.subject] || 'Completed'}{s.part > 0 ? ` — Part ${s.part}` : ''}</td><td>{s.level || '—'}</td><td>{s.partBatch || s.batch || '—'}</td>
            <td>{s.status.replaceAll('_', ' ')}</td><td><details><summary>Progress</summary>
              {s.migrationPending && <p>Migration preview — existing progress unchanged.</p>}
              {['add','sub','mul','div'].map(op => <p key={op}>{subjectNames[op]}: {s.subjects[op]?.status?.replaceAll('_', ' ') || (s.grandfatheredAccess.includes(op) ? 'Legacy access' : 'Locked')}
                {' · '}Completed levels: {s.completedLevels?.[op]?.join(', ') || '—'}</p>)}
            </details></td>
          </tr>)}</tbody></table>
      </section>}
      </details>
    </section>
  </main>;
}
