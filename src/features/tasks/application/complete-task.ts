import { eq, and } from 'drizzle-orm';
import { getDatabase } from '../../../db/client';
import { tasks, completionEvents, progressionState, progressionEvents, taskOccurrences } from '../../../db/schema';

export async function completeTaskUseCase(taskId: string): Promise<boolean> {
  const db = await getDatabase();

  return db.transaction(async (tx) => {
    const task = await tx.select().from(tasks).where(eq(tasks.id, taskId)).get();
    if (!task || task.status === 'completed' || task.status === 'deleted') {
      return false;
    }

    const now = Date.now();

    const existing = await tx
      .select()
      .from(completionEvents)
      .where(eq(completionEvents.taskId, taskId))
      .get();
    if (existing) return false;

    await tx.insert(completionEvents).values({
      id: `ce_${now}_${Math.random().toString(36).slice(2, 9)}`,
      taskId,
      occurrenceId: null,
      completedAt: now,
      source: 'manual',
    });

    if (task.isRecurring === 0 && task.isProgressive === 0) {
      await tx.update(tasks).set({ status: 'completed', updatedAt: now }).where(eq(tasks.id, taskId));
    } else if (task.isProgressive === 1) {
      const prog = await tx.select().from(progressionState).where(eq(progressionState.taskId, taskId)).get();
      if (prog && prog.status !== 'completed') {
        const existingAdvance = await tx
          .select()
          .from(progressionEvents)
          .where(
            and(
              eq(progressionEvents.progressionId, prog.id),
              eq(progressionEvents.eventType, 'advance'),
              eq(progressionEvents.cursorValue, prog.currentCursor)
            )
          )
          .get();

        if (!existingAdvance) {
          const match = prog.currentCursor.match(/^(.+?)(\d+)$/);
          let nextCursor = prog.currentCursor;
          if (match) {
            nextCursor = `${match[1]}${parseInt(match[2] ?? '0', 10) + 1}`;
          } else {
            nextCursor = `${prog.currentCursor}_1`;
          }

          await tx.insert(progressionEvents).values({
            id: `pe_${now}_${Math.random().toString(36).slice(2, 9)}`,
            progressionId: prog.id,
            eventType: 'advance',
            cursorValue: prog.currentCursor,
            timestamp: now,
          });

          const newAmount = (prog.completedAmount ?? 0) + 1;
          await tx
            .update(progressionState)
            .set({
              currentCursor: nextCursor,
              completedAmount: newAmount,
              status: newAmount >= prog.totalAmount ? 'completed' : 'in_progress',
              updatedAt: now,
            })
            .where(eq(progressionState.id, prog.id));
        }
      }
    } else if (task.isRecurring === 1) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayMs = todayStart.getTime();

      const occ = await tx
        .select()
        .from(taskOccurrences)
        .where(and(eq(taskOccurrences.taskId, taskId), eq(taskOccurrences.dueDate, todayMs)))
        .get();

      if (occ) {
        await tx
          .update(taskOccurrences)
          .set({ status: 'completed', completedAt: now })
          .where(eq(taskOccurrences.id, occ.id));
      }
    }

    return true;
  });
}
