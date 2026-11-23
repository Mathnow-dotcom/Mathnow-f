import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AdminBrand from './admin/AdminBrand.jsx';
import { errorLogs, resolveErrorLog } from '../api/mathApi.js';
import '../styles/AdminErrorLogs.css';
const date = value => value ? new Date(value).toLocaleString() : '—';
export default function AdminErrorLogs() {
  const pin = localStorage.getItem('math-admin-pin');
  const navigate = useNavigate();
  const [filters,setFilters] = useState({source:'',state:'open',q:''});
  const [query,setQuery] = useState(filters);
  const [page,setPage] = useState(0);
  const [data,setData] = useState({items:[],total:0});
  const [busy,setBusy] = useState(true);
  const [error,setError] = useState('');
  const [saving,setSaving] = useState('');
  const [version,setVersion] = useState(0);
  useEffect(() => {
    if (!pin) return;
    let cancelled = false; setBusy(true); setError('');
    errorLogs(pin,{...query,page}).then(result => { if (!cancelled) setData(result); })
      .catch(() => { if (!cancelled) setError('Unable to load error logs. Check admin access and retry.'); })
      .finally(() => { if (!cancelled) setBusy(false); });
    return () => { cancelled = true; };
  },[pin,query,page,version]);
  if (!pin) return <Navigate to="/name" replace />;
  async function resolve(issue) {
    setSaving(issue.id); setError('');
    try { await resolveErrorLog(pin,issue.id,!issue.resolved); setVersion(v=>v+1); }
    catch { setError('Could not update the issue. Please retry.'); }
    finally { setSaving(''); }
  }
  return <main className="admin-classroom-page error-logs-page">
    <div className="admin-page-utility"><AdminBrand/><button onClick={()=>{localStorage.removeItem('math-admin-pin');navigate('/name',{replace:true});}}>Logout</button></div>
    <div className="error-logs-shell">
      <header className="error-logs-heading"><div><h1>Error Logs</h1><p>Investigate app errors and track their resolution.</p></div><Link to="/admin-dashboard">← Student Stats</Link></header>
      <form className="error-logs-filters" onSubmit={e=>{e.preventDefault();setPage(0);setQuery({...filters});}}>
        <label>Search code or route<input type="search" maxLength={100} value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})} placeholder="Route, error type, code location"/></label>
        <label>Source<select value={filters.source} onChange={e=>setFilters({...filters,source:e.target.value})}><option value="">All sources</option><option value="frontend">Frontend</option><option value="backend">Backend</option></select></label>
        <label>Status<select value={filters.state} onChange={e=>setFilters({...filters,state:e.target.value})}><option value="open">Open</option><option value="resolved">Resolved</option><option value="all">All statuses</option></select></label>
        <button disabled={busy}>Apply filters</button><button type="button" disabled={busy} onClick={()=>setVersion(v=>v+1)}>Refresh</button>
      </form>
      <p className="error-logs-policy">Errors are grouped by technical signature. Resolved issues are deleted after 5 days; inactive open issues expire after 30 days. Storage is limited to 2,000 issues. A new occurrence reopens a resolved issue.</p>
      {error && <p role="alert">{error}</p>}
      {busy ? <p role="status">Loading error logs…</p> : <>
        <p aria-live="polite">{data.total} matching issues</p>
        {data.items.length === 0 ? <section className="error-log-card"><h2>No issues found</h2><p>Try another filter or refresh to check for new errors.</p></section> : data.items.map(issue=><article key={issue.id} className="error-log-card">
          <div className="error-log-title"><div><span className={`error-log-status ${issue.resolved?'resolved':''}`}>{issue.resolved?'Resolved':'Open'}</span><span className="error-log-source">{issue.source}</span><h2>{issue.kind.replaceAll('_',' ')}</h2><code>{issue.route}</code></div>
            <button disabled={!!saving} onClick={()=>resolve(issue)}>{saving===issue.id?'Saving…':issue.resolved?'Reopen issue':'Mark resolved'}</button></div>
          <dl className="error-log-metrics"><div><dt>Occurrences</dt><dd>{issue.occurrences}</dd></div><div><dt>First seen</dt><dd>{date(issue.firstSeen)}</dd></div><div><dt>Last seen</dt><dd>{date(issue.lastSeen)}</dd></div><div><dt>HTTP status</dt><dd>{issue.httpStatus || '—'}</dd></div>{issue.resolved&&<div><dt>Resolved</dt><dd>{date(issue.resolvedAt)}</dd></div>}</dl>
          <details><summary>Technical details</summary><p>Issue ID: <code>{issue.id}</code></p><p>Scheduled expiry: {date(issue.expiresAt)}</p><pre>{issue.frames?.length?issue.frames.join('\n'):'No code location available. Use the route, status and timestamps to investigate.'}</pre><p>Raw messages, request data and student details are intentionally excluded.</p></details>
        </article>)}
        <nav className="error-log-pagination" aria-label="Error log pages"><button disabled={page===0} onClick={()=>setPage(v=>v-1)}>Previous</button><span>Page {page+1}</span><button disabled={(page+1)*25>=data.total} onClick={()=>setPage(v=>v+1)}>Next</button></nav>
      </>}
    </div>
  </main>;
}
