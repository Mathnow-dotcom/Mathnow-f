import { programProgress } from '../api/mathApi.js';

export async function getWordProblemNextRoute(childPin, refreshOperationAndProgress) {
  if (!childPin) return '/name';

  await refreshOperationAndProgress?.();
  const progress = await programProgress(childPin);
  if (progress.subject !== 'add') return '/operations';
  return progress.status === 'ASSESSMENT_READY' ? '/test-a' : '/levels';
}
