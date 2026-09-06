// ══════════════════════════════════════════════════════════
// lib/progression.js — محرك التقدم
// يعتمد فقط على إكمال المهمة (completeTask) لزيادة المؤشر (Cursor)،
// ولا يتقدّم تلقائيًا مع مرور الأيام.
// ══════════════════════════════════════════════════════════
import {
  getProgressionState,
  setProgressionState,
  hasProgressionAdvance,
  addProgressionEvent,
} from './db';
import { uid } from './db';

export function getNextCursor(currentCursor) {
  const match = currentCursor.match(/^(.+?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const num = parseInt(match[2], 10);
    return `${prefix}${num + 1}`;
  }
  return `${currentCursor}_1`;
}

export function getPreviousCursor(currentCursor) {
  const match = currentCursor.match(/^(.+?)(\d+)$/);
  if (match) {
    const num = parseInt(match[2], 10);
    if (num > 0) return `${match[1]}${num - 1}`;
    return currentCursor;
  }
  return currentCursor.replace(/_\d+$/, '');
}

export function isProgressionComplete(state) {
  return state.status === 'completed' || state.completedAmount >= state.totalAmount;
}

// تقدّم خطوة واحدة (يُستدعى فقط من completeTask).
export async function advanceProgression(taskId) {
  const state = await getProgressionState(taskId);
  if (!state || isProgressionComplete(state)) return state;

  const advanceExists = await hasProgressionAdvance(state.id, state.currentCursor);
  if (advanceExists) return state;

  const nextCursor = getNextCursor(state.currentCursor);
  const newCompletedAmount = (state.completedAmount ?? 0) + 1;
  const now = Date.now();

  const updated = {
    ...state,
    currentCursor: nextCursor,
    completedAmount: newCompletedAmount,
    status: newCompletedAmount >= state.totalAmount ? 'completed' : 'in_progress',
    completedAt: newCompletedAmount >= state.totalAmount ? now : state.completedAt,
    updatedAt: now,
  };

  await addProgressionEvent({
    progressionId: state.id,
    cursorValue: state.currentCursor,
    eventType: 'advance',
    timestamp: now,
  });

  await setProgressionState(updated);
  return updated;
}

export function createProgressionForTask(taskId, { currentCursor = '0', target = '', totalAmount = 1 } = {}) {
  return {
    id: uid('ps'),
    taskId,
    currentCursor,
    target,
    completedAmount: 0,
    totalAmount: Math.max(1, totalAmount),
    status: 'in_progress',
    startedAt: Date.now(),
    completedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}