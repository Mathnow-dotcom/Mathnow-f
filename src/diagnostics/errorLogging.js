const base = import.meta.env.VITE_API_BASE || 'http://localhost:8080/api';
let transport;
let installed = false;
let sent = 0;
let windowStart = 0;
let inFlight = false;
const recent = new Map();
const pending = [];
const routes = new Set(['word-problems','word-problems-complete','name','mode','levels','belts','operations','quiz','learning','pretest','game-mode','theme','results','way-to-go','pretest-intro','pretest-result','admin-dashboard','admin-settings','admin/tests','legacy-test-a-part-1','legacy-test-a-part-2','legacy-test-b','legacy-test-c','legacy-test-c-part-1','legacy-test-c-part-2','legacy-test-d']);
export function safeRoute(path) {
  const clean = path.replace(/^\/+|\/+$/g, '');
  if (/^admin\/students\/[^/]+\/analytics$/.test(clean)) return 'admin/student-analytics';
  if (/^admin\/tests\/[^/]+$/.test(clean)) return 'admin/tests';
  return routes.has(clean) ? clean : 'other';
}
// Only bundle location is extracted. Never transmit error.message, full stack, URL query or context.
export function reportError(kind, error, status = 0, path = location.pathname) {
  try {
    if (!transport || pending.length >= 8) return;
    const now = Date.now();
    if (now - windowStart > 60000) { sent = 0; windowStart = now; recent.clear(); }
    if (sent >= 10) return;
    const payload = { kind, route: safeRoute(path), status };
    const stack = typeof error?.stack === 'string' ? error.stack : '';
    const match = stack.match(/\/assets\/([A-Za-z][A-Za-z0-9_-]{0,70}\.js):(\d+):(\d+)/);
    if (match) { payload.file = match[1]; payload.line = Number(match[2]); payload.column = Number(match[3]); }
    const key = JSON.stringify(payload);
    if (recent.has(key)) return;
    recent.set(key, now); sent++;
    pending.push(key);
    drain();
  } catch { /* Telemetry is always best effort. */ }
}
function drain() {
  if (inFlight || !pending.length) return;
  inFlight = true;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  // No credentials, PIN, authorization headers, referrer, cookies or persistent retry queue.
  Promise.resolve().then(() => transport(`${base}/error-logs`, { method:'POST', credentials:'omit', referrerPolicy:'no-referrer',
    headers:{'Content-Type':'application/json'}, body:pending[0], signal:controller.signal }))
    .catch(() => {}).finally(() => {
      clearTimeout(timer); pending.shift(); inFlight = false; drain();
    });
}

export function installErrorLogging() {
  if (installed) return;
  installed = true;
  transport = window.fetch.bind(window);
  window.addEventListener('error', event => reportError('runtime', event.error));
  window.addEventListener('unhandledrejection', event => reportError('promise', event.reason));
  const api = new URL(base, location.origin);
  window.fetch = async function(input, options) {
    let relevant = false;
    try {
      const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, location.origin);
      relevant = url.origin === api.origin && url.pathname.startsWith(`${api.pathname.replace(/\/$/, '')}/`) && !url.pathname.includes('/error-logs');
    } catch { /* Preserve fetch's normal validation. */ }
    try {
      const response = await transport(input, options);
      if (relevant && response.status >= 400) reportError('http', null, response.status);
      return response;
    } catch (error) {
      if (relevant && error?.name !== 'AbortError') reportError('network');
      throw error;
    }
  };
}
