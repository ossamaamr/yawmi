import { eq } from 'drizzle-orm';
import { getDatabase } from '../../../db/client';
import { tasks } from '../../../db/schema';

export interface EditTaskInput {
  title?: string;
  description?: string;
  categoryId?: string;
  projectId?: string;
  subjectId?: string;
  priority?: number;
  status?: string;
  dueDate?: number;
  dueTime?: string | null;
}

export async function editTaskUseCase(taskId: string, input: EditTaskInput) {
  const db = await getDatabase();
  const [updated] = await db
    .update(tasks)
    .set({ ...input, updatedAt: Date.now() })
    .where(eq(tasks.id, taskId))
    .returning();
  return updated;
}
