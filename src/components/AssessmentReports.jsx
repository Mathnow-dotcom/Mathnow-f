import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { assessmentReports, assessmentExport } from '../api/mathApi.js';
import '../styles/Assessment.css';

const duration = (ms) => `${(ms / 1000).toFixed(1)}s`;
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
      <p className="mb-6">Completed assessment history. Learning scores and belts are unaffected.</p>
      <form className="assessment-filters" onSubmit={e => {
        e.preventDefault();
        if (filters.from && filters.to && filters.from > filters.to) { setError('Start date must be before end date.'); return; }
        setPage(0); setQuery(queryDates(filters));
      }}>
        <label>Student PIN<input value={filters.student} onChange={e => setFilters({ ...filters, student: e.target.value })} /></label>
        <label>Test<select value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All tests</option><option value="A">Test A — Addition</option></select></label>
        <label>From<input type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} /></label>
        <label>To<input type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} /></label>
        <button disabled={busy}>Apply filters</button>
        <button type="button" disabled={exporting || busy} onClick={download}>{exporting ? 'Exporting…' : 'Export CSV'}</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {busy ? <p role="status">Loading results…</p> : <div className="assessment-results">
        {rows.length === 0 ? <p>No completed tests found.</p> : <table><thead><tr>
          <th>Student</th><th>Test</th><th>Completed</th><th>Accuracy</th><th>Total time</th><th>Per-item detail</th>
        </tr></thead><tbody>{rows.map(row => <tr key={row.id}>
          <td>{row.student}<br /><small>#{row.pin}</small></td><td>{row.type}</td>
          <td>{new Date(row.completedAt).toLocaleString()}</td>
          <td>{row.correct}/{row.count} ({row.percent.toFixed(1)}%)</td><td>{duration(row.totalMs)}</td>
          <td><details><summary>View {row.count} items</summary><table><thead><tr>
            <th>Problem</th><th>Answer</th><th>Result</th><th>Time</th>
          </tr></thead><tbody>{row.answers.map((a, i) => <tr key={i}><td>{a.problem}</td><td>{a.answer}</td>
            <td>{a.correct ? 'Correct' : 'Incorrect'}</td><td>{duration(a.timeMs)}</td></tr>)}</tbody></table></details></td>
        </tr>)}</tbody></table>}
      </div>}
      <div className="assessment-toolbar mt-6">
        <button disabled={busy || page === 0} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Page {page + 1}</span><button disabled={busy || rows.length < 25} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </section>
  </main>;
}
