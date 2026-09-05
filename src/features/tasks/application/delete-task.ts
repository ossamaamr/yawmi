import { eq } from 'drizzle-orm';
import { getDatabase } from '../../../db/client';
import { tasks, reminders } from '../../../db/schema';

export async function deleteTaskUseCase(taskId: string): Promise<void> {
  const db = await getDatabase();
  await db.transaction(async (tx) => {
    await tx.update(reminders).set({ isActive: 0 }).where(eq(reminders.taskId, taskId));
    await tx.update(tasks).set({ status: 'deleted', updatedAt: Date.now() }).where(eq(tasks.id, taskId));
  });
}
