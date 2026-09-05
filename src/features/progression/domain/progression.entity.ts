import { ProgressionState } from './progression.types';

export function canAdvanceProgression(
  state: ProgressionState,
  hasNewCompletionEvent?: boolean
): boolean {
  if (state.status === 'completed') return false;
  if (state.completedSteps >= state.totalSteps) return false;
  if (hasNewCompletionEvent !== undefined) {
    return hasNewCompletionEvent;
  }
  return true;
}

function extractNumber(cursor: string): number {
  const match = cursor.match(/(\d+)$/);
  if (!match) return 0;
  return parseInt(match[1] ?? '0', 10);
}

function replaceTrailingNumber(cursor: string, newNumber: number): string {
  return cursor.replace(/\d+$/, String(newNumber));
}

export function getNextCursor(currentCursor: string): string {
  const num = extractNumber(currentCursor);
  if (num === 0) {
    return `${currentCursor}_1`;
  }
  return replaceTrailingNumber(currentCursor, num + 1);
}

export function isProgressionComplete(state: ProgressionState): boolean {
  return state.status === 'completed' && state.completedSteps >= state.totalSteps;
}
