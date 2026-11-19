import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaClipboardList, FaSignOutAlt } from 'react-icons/fa';
import { assessmentReportDetail } from '../api/mathApi.js';
import AdminBrand from './admin/AdminBrand.jsx';
import '../styles/Assessment.css';
import '../styles/AssessmentReports.css';

const names = { A: 'Addition', B: 'Subtraction', C: 'Multiplication', D: 'Division' };
const date = value => value ? new Date(value).toLocaleString() : '—';
const duration = value => Number.isFinite(value) ? `${(value / 1000).toFixed(2)} s` : '—';
const percent = value => Number.isFinite(value) ? `${value.toFixed(1)}%` : '—';

export default function AssessmentReportDetail() {
  const { attemptId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const pin = localStorage.getItem('math-admin-pin');
  const [row, setRow] = useState(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const returnTo = /^\/admin\/tests(?:\?|$)/.test(location.state?.returnTo || '') ? location.state.returnTo : '/admin/tests';
  useEffect(() => { window.scrollTo(0, 0); }, [attemptId]);
  useEffect(() => {
    if (!pin) return;
    let cancelled = false;
    setRow(null); setError('');
    assessmentReportDetail(pin, attemptId).then(data => { if (!cancelled) setRow(data); })
      .catch(error => { if (!cancelled) setError(error.message || 'Unable to load test details.'); });
    return () => { cancelled = true; };
  }, [pin, attemptId, reload]);
  if (!pin) return <Navigate to="/name" replace />;
  const status = row?.status === 'Ended unfinished' ? 'Incomplete' : row?.status || 'Completed';
  const answers = row?.answers || [];
  const items = row?.items || answers.map(answer => answer.problem);
  return <main className="assessment-page admin-classroom-page admin-reports-page admin-test-detail-page">
    <div className="admin-page-utility"><AdminBrand />
      <button type="button" onClick={() => { localStorage.removeItem('math-admin-pin'); navigate('/name', { replace: true }); }}><FaSignOutAlt aria-hidden="true" /> Logout</button>
    </div>
    <header className="admin-reports-header">
      <div className="admin-reports-title-row"><span className="admin-reports-title-icon"><FaClipboardList aria-hidden="true" /></span><h1>Test item details</h1></div>
      <Link className="assessment-back-link" to={returnTo}><FaArrowLeft aria-hidden="true" /> Back to test results</Link>
    </header>
    {!row && !error && <p role="status">Loading test details…</p>}
    {error && <section className="assessment-detail-summary" role="alert"><p>{error}</p><button type="button" onClick={() => setReload(value => value + 1)}>Retry</button></section>}
    {row && <>
      <section className="assessment-detail-summary" aria-label="Test attempt summary">
        <div className="assessment-detail-heading"><div className="assessment-detail-identity"><span className="assessment-student-avatar" aria-hidden="true">{String(row.student || "?").charAt(0).toUpperCase()}</span><div><h2>{row.student || 'Student'} <small>#{row.pin}</small></h2>
          <p>Test {row.type} — {names[row.type] || row.type}{row.part ? ` · Part ${row.part}` : ''}</p>
          <p>{row.flow === 'legacy' ? 'HIGH STAKES TEST' : `Learning assessment · Batch ${row.partBatch ?? row.batch ?? '—'}`}</p></div></div>
          <span className="assessment-detail-status">{status}</span></div>
        <dl className="assessment-detail-metrics">
          <div><dt>Answered</dt><dd>{row.answered ?? answers.length} / {row.count}</dd></div>
          <div><dt>Accuracy</dt><dd>{percent(row.percent)}</dd></div>
          <div><dt>Total time</dt><dd>{duration(row.totalMs)}</dd></div>
          <div><dt>Average per item</dt><dd>{duration(row.averageTimeMs)}</dd></div>
        </dl>
        <dl className="assessment-detail-dates">
          <div><dt>Started</dt><dd>{date(row.startedAt)}</dd></div>
          <div><dt>ended</dt><dd>{date(row.completedAt || row.endedAt)}</dd></div>
        </dl>
      </section>
      <section className="assessment-report assessment-detail-items">
        <div className="assessment-items-heading"><h2>Question breakdown <span>{row.count} items</span></h2>
       </div>
        <div className="assessment-results"><table><thead><tr><th>#</th><th>Problem</th><th>Answer</th><th>Result</th><th>Time</th><th>Answered at</th></tr></thead>
          <tbody>{items.map((problem, index) => { const answer = answers[index]; return <tr key={index}>
            <td>{index + 1}</td><td>{problem}</td><td>{answer?.answer ?? '—'}</td>
            <td><span className={`assessment-result-badge ${!answer ? 'is-neutral' : answer.correct ? 'is-pass' : 'is-fail'}`}>{!answer ? 'Not answered' : answer.correct ? 'Correct' : 'Incorrect'}</span></td>
            <td>{answer ? duration(answer.timeMs) : '—'}</td><td>{answer?.answeredAt ? date(answer.answeredAt) : 'Not recorded'}</td>
          </tr>; })}</tbody></table></div>
      </section>
    </>}
  </main>;
}
