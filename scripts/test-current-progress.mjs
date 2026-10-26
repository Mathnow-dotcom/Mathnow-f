import assert from 'node:assert/strict';
import { currentProgramProgress } from '../src/utils/currentProgress.js';
const progress = {
  _current: { operation: 'sub', level: 17 },
  sub: { L17: { unlocked: true, yellow: { unlocked: true } } },
  mul: { L1: { unlocked: true, white: { unlocked: true } } },
};
assert.deepEqual(currentProgramProgress(progress), { operation: 'sub', level: 17, data: progress.sub.L17 });
assert.equal(currentProgramProgress({ ...progress, _current: { operation: 'mul', level: 1 } }).operation, 'mul');
assert.equal(currentProgramProgress({}), null);
assert.equal(currentProgramProgress({ _current: { operation: 'frac', level: 6 } }).level, 6);
assert.equal(currentProgramProgress({ _current: { operation: 'sub', level: -1 } }), null);
assert.equal(currentProgramProgress({ _current: { operation: 'sub', level: 12 } }).data.white.unlocked, true);
console.log('PASS: cumulative current progress, subject transition, legacy and missing-node fallback');
