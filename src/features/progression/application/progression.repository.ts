import { eq, and } from 'drizzle-orm';
import { getDatabase } from '../../../db/client';
import { progressionState, progressionEvents } from '../../../db/schema';

export interface ProgressionStateRecord {
  id: string;
  taskId: string;
  currentCursor: string;
  target: string;
  completedAmount: number;
  totalAmount: number;
  status: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProgressionEventRecord {
  id: string;
  progressionId: string;
  eventType: string;
  cursorValue: string;
  timestamp: number;
}

function getNextCursor(currentCursor: string): string {
  const match = currentCursor.match(/^(.+?)(\d+)$/);
  if (match) {
    const prefix = match[1]!;
    const num = parseInt(match[2]!, 10);
    return `${prefix}${num + 1}`;
  }
  return `${currentCursor}_1`;
}

export async function createProgressionState(data: {
  taskId: string;
  currentCursor: string;
  target: string;
  totalAmount: number;
}): Promise<ProgressionStateRecord> {
  const db = await getDatabase();
  const id = `ps_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = Date.now();

  const [created] = await db
    .insert(progressionState)
    .values({
      id,
      taskId: data.taskId,
      currentCursor: data.currentCursor,
      target: data.target,
      completedAmount: 0,
      totalAmount: data.totalAmount,
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return created as ProgressionStateRecord;
}

export async function getProgressionStateByTaskId(
  taskId: string
): Promise<ProgressionStateRecord | undefined> {
  const db = await getDatabase();
  const result = await db
    .select()
    .from(progressionState)
    .where(eq(progressionState.taskId, taskId))
    .get();
  return result as ProgressionStateRecord | undefined;
}

export async function advanceProgression(
  taskId: string
): Promise<ProgressionStateRecord | null> {
  const db = await getDatabase();
  let result: ProgressionStateRecord | null = null;

  await db.transaction(async (tx) => {
    const state = await tx
      .select()
      .from(progressionState)
      .where(eq(progressionState.taskId, taskId))
      .get();

    if (!state || state.status === 'completed') {
      return;
    }

    const existingAdvance = await tx
      .select()
      .from(progressionEvents)
      .where(
        and(
          eq(progressionEvents.progressionId, state.id),
          eq(progressionEvents.eventType, 'advance'),
          eq(progressionEvents.cursorValue, state.currentCursor)
        )
      )
      .get();

    if (existingAdvance) {
      return;
    }

    const now = Date.now();
    const eventId = `pe_${now}_${Math.random().toString(36).slice(2, 9)}`;

    await tx.insert(progressionEvents).values({
      id: eventId,
      progressionId: state.id,
      eventType: 'advance',
      cursorValue: state.currentCursor,
      timestamp: now,
    });

    const nextCursor = getNextCursor(state.currentCursor);
    const newCompletedAmount = (state.completedAmount ?? 0) + 1;
    const isCompleted = newCompletedAmount >= state.totalAmount;

    const [updated] = await tx
      .update(progressionState)
      .set({
        currentCursor: nextCursor,
        completedAmount: newCompletedAmount,
        status: isCompleted ? 'completed' : 'in_progress',
        updatedAt: now,
      })
      .where(eq(progressionState.id, state.id))
      .returning();

    result = updated as ProgressionStateRecord;
  });

  return result;
}

export async function getProgressionEvents(
  progressionId: string
): Promise<ProgressionEventRecord[]> {
  const db = await getDatabase();
  const results = await db
    .select()
    .from(progressionEvents)
    .where(eq(progressionEvents.progressionId, progressionId))
    .all();
  return results as ProgressionEventRecord[];
}
