// Isolated browser smoke test: no live backend/database calls and no extra test dependencies.
// Run: node scripts/test-assessment-browser.mjs (Chrome required; CHROME_BIN can override its path).
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const origin = 'http://127.0.0.1:59991';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const wait = async (fn, label) => {
  for (let i = 0; i < 120; i++) { try { if (await fn()) return; } catch {} await delay(100); }
  throw new Error(`Timed out: ${label}`);
};
const profile = await mkdtemp(join(tmpdir(), 'mathnow-assessment-test-'));
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '59991', '--strictPort'], {
  env: { ...process.env, VITE_API_BASE: 'http://127.0.0.1:59992/api' }, stdio: 'ignore',
});
const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--disable-background-networking',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });
let socket;
try {
  await wait(async () => (await fetch(origin)).ok, 'Vite startup');
  let port;
  await wait(async () => { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; return !!port; }, 'Chrome startup');
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let sequence = 0;
  const pending = new Map();
  const calls = [];
  const exceptions = [];
  let active = null, serial = 0, loseAnswerResponse = false;
  let holdNextAnswer = false, releaseAnswerResponse = null;
  const starts = new Map();
  const problems = ['1 + 2', '2 + 1', '1 + 1'];
  const state = () => active && ({ ...active, problem: active.completed ? null : problems[active.position],
    nextProblem: active.completed ? null : problems[active.position + 1] || null });
  const usage = { sessionId: 'test-usage', date: new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }), todayUsageMs: 10000, lifetimeUsageMs: 10000 };
  const command = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params }));
  });
  socket.addEventListener('message', async event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const promise = pending.get(message.id); pending.delete(message.id);
      if (message.error) promise?.reject(new Error(JSON.stringify(message.error))); else promise?.resolve(message.result);
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
    if (message.method !== 'Fetch.requestPaused') return;
    const { requestId, request } = message.params;
    if (request.method === 'OPTIONS') {
      await command('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: [
        { name: 'Access-Control-Allow-Origin', value: origin }, { name: 'Access-Control-Allow-Headers', value: '*' },
        { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
      ] });
      return;
    }
    const path = new URL(request.url).pathname.replace('/api', '');
    const body = request.postData ? JSON.parse(request.postData) : {};
    calls.push({ path, body, query: new URL(request.url).search });
    if (body.action === 'answer' && holdNextAnswer) {
      holdNextAnswer = false;
      await new Promise(resolve => { releaseAnswerResponse = resolve; });
    }
    let response = {};
    if (path === '/auth/login-pin') response = { user: { name: 'Demo', pin: '77777', theme: 'underwater', progress: {}, dailyStats: {}, currentStreak: 2, appUsage: usage } };
    if (path.startsWith('/user/usage/')) response = usage;
    if (path === '/assessments/current') response = { attempt: active?.completed ? null : state() };
    if (path === '/assessments/start') {
      if (starts.has(body.beginKey)) active = starts.get(body.beginKey);
      else if (!active || active.completed) {
        active = { id: `test-${++serial}`, type: 'A', position: 0, count: 3, completed: false };
        starts.set(body.beginKey, active);
      }
      response = state();
    } else if (path.startsWith('/assessments/') && path !== '/assessments/current') {
      if (body.action === 'answer' && body.position === active.position && !active.completed) {
        active.position++; active.completed = active.position === active.count;
        if (loseAnswerResponse) {
          loseAnswerResponse = false;
          await command('Fetch.failRequest', { requestId, errorReason: 'ConnectionClosed' }); return;
        }
      }
      response = state();
    }
    if (path === '/admin/assessments') response = [{ id: 'test-1', student: 'Demo', pin: '77777', type: 'A', completedAt: new Date().toISOString(),
      correct: 2, count: 3, percent: 200/3, totalMs: 6000, answers: [{ problem: '1 + 2', answer: '3', correct: true, timeMs: 2000 }] }];
    await command('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [
      { name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: origin },
      { name: 'Access-Control-Allow-Headers', value: '*' }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
    ], body: Buffer.from(path === '/admin/assessments/export' ? 'Student,Test\r\nDemo,A\r\n' : JSON.stringify(response)).toString('base64') });
  });
  await command('Runtime.enable');
  await command('Page.enable');
  await command('Fetch.enable', { patterns: [{ urlPattern: 'http://127.0.0.1:59992/*' }] });
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const text = () => evaluate('document.body.innerText');
  const see = value => wait(async () => (await text()).includes(value), value);
  const click = async label => {
    await wait(() => evaluate(`Array.from(document.querySelectorAll('button')).some(b => b.textContent.trim() === ${JSON.stringify(label)} && !b.disabled)`), `button ${label}`);
    await evaluate(`Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === ${JSON.stringify(label)} && !b.disabled).click()`);
  };
  const login = async () => { await click('Demo'); await click('YES'); await click('NEXT'); await see('What would you like to do?'); };
  const openTest = async () => { await click('TAKE A TEST'); await click('TEST A — Addition'); };

  await command('Page.navigate', { url: `${origin}/name` });
  await login();
  for (const [width, height] of [[320,568], [390,844], [844,390], [768,1024], [1440,900]]) {
    await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor:1, mobile:false });
    for (const page of ['mode', 'test-selection']) {
      if (page === 'test-selection') await click('TAKE A TEST');
      await wait(() => evaluate(`location.pathname === '/${page}' && !!document.querySelector('.assessment-selection-card')`), `Selection page ${page}`);
      // Wait for layout after a viewport/route change, including responsive font sizing.
      await delay(100);
      const layout = await evaluate(`(() => {
        const card = document.querySelector('.assessment-selection-card');
        const bounds = card.getBoundingClientRect();
        return {
          fits: document.documentElement.scrollWidth <= innerWidth && bounds.left >= 0 && bounds.right <= innerWidth,
          buttons: Array.from(card.querySelectorAll('.assessment-choices button')).map(b => ({
            height:b.getBoundingClientRect().height, color:getComputedStyle(b).backgroundColor
          }))
        };
      })()`);
      assert(layout.fits, `${page} fits viewport ${width}x${height}`);
      assert(layout.buttons.every(b => b.height >= 44 && b.color === 'rgb(21, 157, 84)'), 'Touch targets and existing green preserved');
      if (page === 'mode') assert(layout.buttons.every(b => b.height <= 80), 'Mode buttons stay compact');
      else {
        assert(await evaluate('document.querySelectorAll(".assessment-choices button")[1].disabled'), 'Test B stays disabled');
        await click('Back');
      }
    }
  }
  await command('Emulation.clearDeviceMetricsOverride');
  await click('LEARN');
  await wait(() => evaluate('location.pathname === "/operations"'), 'Existing LEARN route').catch(async e => {
    throw new Error(`${e.message}; path=${await evaluate('location.pathname')}; screen=${(await text()).slice(0, 500)}`);
  });
  await wait(() => evaluate(`!!document.querySelector('button[aria-label="Back to mode selection"]')`), 'Operations back button');
  await evaluate(`document.querySelector('button[aria-label="Back to mode selection"]').click()`);
  await wait(() => evaluate('location.pathname === "/mode"'), 'Operations back returns to mode');
  await see('What would you like to do?');
  await openTest();
  assert.equal(calls.filter(c => c.path === '/assessments/start').length, 0, 'Instructions must not start timing');
  await click('Begin'); await see('Question 1 of 3');
  assert(!(await text()).includes('Correct'), 'No correctness feedback');
  await evaluate(`{
    const input = document.querySelector('#test-answer');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'a3b');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }`);
  assert.equal(await evaluate('document.querySelector("#test-answer").value'), '3', 'Input accepts numeric characters only');
  loseAnswerResponse = true; await click('Submit'); await see('Failed to fetch');
  await see('Question 1 of 3');
  assert.equal(await evaluate('document.querySelector("#test-answer").value'), '3', 'Failed save restores submitted answer');
  await click('Submit'); await see('Question 2 of 3');
  assert.equal(active.position, 1, 'Retry must not skip a question');
  await click('⚙ Quit test'); await click('Save & return to mode');
  await see('What would you like to do?'); await openTest();
  await click('Resume test'); await see('Question 2 of 3');
  await click('3'); holdNextAnswer = true;
  await wait(() => evaluate('!document.querySelector("button[type=submit]").disabled'), 'Ready to submit');
  const immediateProblem = await evaluate(`(() => {
    document.querySelector('button[type=submit]').click();
    return document.querySelector('.assessment-problem').textContent;
  })()`);
  assert.equal(immediateProblem, '1 + 1', 'Next question commits synchronously on click');
  await see('Question 3 of 3');
  await wait(() => !!releaseAnswerResponse, 'Held answer request');
  assert.equal(active.position, 1, 'Next question is visible before the server saves');
  assert.equal(await evaluate('document.querySelector("button[type=submit]").textContent'), 'Submit', 'No saving label');
  assert.equal(await evaluate('getComputedStyle(document.querySelector("button[type=submit]")).backgroundColor'), 'rgb(243, 244, 246)', 'Empty next answer has neutral Submit');
  await click('2');
  await wait(() => evaluate('getComputedStyle(document.querySelector("button[type=submit]")).backgroundColor === "rgb(21, 157, 84)"'), 'Typed answer has green Submit');
  assert.equal(await evaluate('document.querySelector("button[type=submit]").disabled'), true, 'Do not submit the next answer before acknowledgement');
  const answerCalls = calls.filter(c => c.body.action === 'answer').length;
  await evaluate('document.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))');
  assert.equal(calls.filter(c => c.body.action === 'answer').length, answerCalls, 'Repeated submit is blocked');
  releaseAnswerResponse(); releaseAnswerResponse = null;
  await wait(() => evaluate('!document.querySelector("button[type=submit]").disabled'), 'Save acknowledgement');
  assert.equal(await evaluate('document.querySelector("#test-answer").value'), '2', 'Acknowledgement preserves next question input');
  await command('Page.reload'); await see('Enter Your Name'); await login(); await openTest();
  await click('Resume test'); await see('Question 3 of 3');
  assert.equal(await evaluate('document.querySelector("#test-answer").value'), '2', 'Draft survives refresh');
  holdNextAnswer = true; await click('Submit');
  await wait(() => !!releaseAnswerResponse, 'Held final answer');
  assert.equal(await evaluate('document.querySelector("button[type=submit]").textContent'), 'Submit', 'Final save keeps Submit label');
  assert(!(await text()).includes('Test complete'), 'Completion requires server confirmation');
  releaseAnswerResponse(); releaseAnswerResponse = null;
  await see('Test complete'); await see('What would you like to do?');
  await openTest(); await click('Begin'); await see('Question 1 of 3');
  assert.equal(serial, 2, 'Completed attempts allow a new attempt');
  assert(calls.some(c => c.path.startsWith('/user/usage/')), 'Global app usage continues');
  assert(!calls.some(c => c.path.startsWith('/quiz/')), 'Tests must not call quiz endpoints');
  await click('⚙ Quit test'); await click('Save & return to mode'); await click('Sign out');
  await see('Confirm To Quit'); await click('YES');
  await wait(() => evaluate('location.pathname === "/"'), 'Existing logout flow').catch(async e => {
    throw new Error(`${e.message}; path=${await evaluate('location.pathname')}; screen=${(await text()).slice(0, 500)}`);
  });
  await evaluate('localStorage.setItem("math-admin-pin", "mock-admin")');
  await command('Page.navigate', { url: `${origin}/admin/tests` });
  await see('66.7%'); await see('View 3 items');
  await evaluate('document.querySelector("summary").click()'); await see('1 + 2');
  await evaluate(`{
    const input = document.querySelector('.assessment-filters input');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '77777');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const select = document.querySelector('select'); select.value = 'A';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }`);
  await click('Apply filters');
  await wait(() => calls.some(c => c.path === '/admin/assessments' && c.query.includes('student=77777') && c.query.includes('type=A')), 'Report filters');
  await click('Export CSV');
  await wait(() => calls.some(c => c.path === '/admin/assessments/export' && c.query.includes('student=77777')), 'Filtered CSV export');
  assert.equal(exceptions.length, 0, `Browser exceptions: ${exceptions.join(', ')}`);
  console.log('PASS: login/streak/mode, Begin, numeric input, retry, quit/resume, refresh/draft, completion, reattempt, usage continuity, admin report/filters/export.');
} finally {
  socket?.close(); chrome.kill(); vite.kill();
  console.log(`Isolated browser profile: ${profile}`);
}
