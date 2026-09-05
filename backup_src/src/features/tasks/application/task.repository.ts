import { eq, and, lt, gte, lte, inArray } from 'drizzle-orm';
import { getDatabase } from '../../../db/client';
import { tasks, completionEvents } from '../../../db/schema';
import { startOfDay, endOfDay, addDays } from '../../../utils/date';

export interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  projectId: string | null;
  subjectId: string | null;
  priority: number;
  status: string;
  isRecurring: number;
  isProgressive: number;
  isRoutine: number;
  dueDate: number | null;
  dueTime: string | null;
  createdAt: number;
  updatedAt: number;
}

export async function createTask(data: {
  title: string;
  description?: string;
  categoryId?: string;
  projectId?: string;
  subjectId?: string;
  priority?: number;
  dueDate?: number;
  dueTime?: string;
  isRecurring?: number;
  isProgressive?: number;
  isRoutine?: number;
}): Promise<TaskRecord> {
  const db = await getDatabase();
  const now = Date.now();
  const id = `task_${now}_${Math.random().toString(36).slice(2, 9)}`;

  const [created] = await db
    .insert(tasks)
    .values({
      id,
      title: data.title,
      description: data.description ?? null,
      categoryId: data.categoryId ?? null,
      projectId: data.projectId ?? null,
      subjectId: data.subjectId ?? null,
      priority: data.priority ?? 0,
      status: 'active',
      isRecurring: data.isRecurring ?? 0,
      isProgressive: data.isProgressive ?? 0,
      isRoutine: data.isRoutine ?? 0,
      dueDate: data.dueDate ?? null,
      dueTime: data.dueTime ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return created as TaskRecord;
}

export async function getTaskById(id: string): Promise<TaskRecord | undefined> {
  const db = await getDatabase();
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).get();
  return result as TaskRecord | undefined;
}

export async function updateTask(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    categoryId: string;
    projectId: string;
    subjectId: string;
    priority: number;
    status: string;
    dueDate: number;
    dueTime: string;
  }>
): Promise<TaskRecord | undefined> {
  const db = await getDatabase();
  const [updated] = await db
    .update(tasks)
    .set({ ...data, updatedAt: Date.now() })
    .where(eq(tasks.id, id))
    .returning();
  return updated as TaskRecord | undefined;
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDatabase();
  await db
    .update(tasks)
    .set({ status: 'deleted', updatedAt: Date.now() })
    .where(eq(tasks.id, id));
}

export async function completeTask(taskId: string): Promise<TaskRecord | undefined> {
  const db = await getDatabase();
  let result: TaskRecord | undefined;

  await db.transaction(async (tx) => {
    const task = await tx.select().from(tasks).where(eq(tasks.id, taskId)).get();

    if (!task || task.status === 'completed' || task.status === 'deleted') {
      return;
    }

    const now = Date.now();

    const existingCompletion = await tx
      .select()
      .from(completionEvents)
      .where(eq(completionEvents.taskId, taskId))
      .get();

    if (existingCompletion) {
      return;
    }

    await tx.insert(completionEvents).values({
      id: `ce_${now}_${Math.random().toString(36).slice(2, 9)}`,
      taskId,
      occurrenceId: null,
      completedAt: now,
      source: 'manual',
    });

    if (task.isRecurring === 0 && task.isProgressive === 0) {
      const [updated] = await tx
        .update(tasks)
        .set({ status: 'completed', updatedAt: now })
        .where(eq(tasks.id, taskId))
        .returning();
      result = updated as TaskRecord;
    } else if (task.isProgressive === 1) {
      const { progressionState: psTable, progressionEvents: peTable } = await import('../../../db/schema');

      const progression = await tx
        .select()
        .from(psTable)
        .where(eq(psTable.taskId, taskId))
        .get();

      if (progression && progression.status !== 'completed') {
        const existingAdvance = await tx
          .select()
          .from(peTable)
          .where(
            and(
              eq(peTable.progressionId, progression.id),
              eq(peTable.eventType, 'advance'),
              eq(peTable.cursorValue, progression.currentCursor)
            )
          )
          .get();

        if (!existingAdvance) {
          await tx.insert(peTable).values({
            id: `pe_${now}_${Math.random().toString(36).slice(2, 9)}`,
            progressionId: progression.id,
            eventType: 'advance',
            cursorValue: progression.currentCursor,
            timestamp: now,
          });

          const match = progression.currentCursor.match(/^(.+?)(\d+)$/);
          let nextCursor = progression.currentCursor;
          if (match) {
            nextCursor = `${match[1]}${parseInt(match[2] ?? '0', 10) + 1}`;
          } else {
            nextCursor = `${progression.currentCursor}_1`;
          }

          const newCompletedAmount = (progression.completedAmount ?? 0) + 1;
          const isCompleted = newCompletedAmount >= progression.totalAmount;

          await tx
            .update(psTable)
            .set({
              currentCursor: nextCursor,
              completedAmount: newCompletedAmount,
              status: isCompleted ? 'completed' : 'in_progress',
              updatedAt: now,
            })
            .where(eq(psTable.id, progression.id));
        }
      }

      result = task as TaskRecord;
    } else {
      result = task as TaskRecord;
    }
  });

  return result;
}

export async function getTodayItems(): Promise<TaskRecord[]> {
  const db = await getDatabase();
  const todayStart = startOfDay(Date.now());
  const todayEnd = endOfDay(Date.now());

  const todayTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        gte(tasks.dueDate, todayStart),
        lte(tasks.dueDate, todayEnd),
        inArray(tasks.status, ['active', 'completed'])
      )
    )
    .all();

  const recurringTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.isRecurring, 1),
        inArray(tasks.status, ['active', 'completed'])
      )
    )
    .all();

  const allTasks = [...todayTasks];
  for (const rt of recurringTasks) {
    if (!allTasks.find((t) => t.id === rt.id)) {
      allTasks.push(rt);
    }
  }

  return allTasks as TaskRecord[];
}

export async function getOverdueTasks(): Promise<TaskRecord[]> {
  const db = await getDatabase();
  const todayStart = startOfDay(Date.now());

  const results = await db
    .select()
    .from(tasks)
    .where(
      and(
        lt(tasks.dueDate, todayStart),
        eq(tasks.status, 'active')
      )
    )
    .all();

  return results as TaskRecord[];
}

export async function getWeekItems(): Promise<TaskRecord[]> {
  const db = await getDatabase();
  const todayStart = startOfDay(Date.now());
  const weekEnd = endOfDay(addDays(todayStart, 6));

  const weekTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        gte(tasks.dueDate, todayStart),
        lte(tasks.dueDate, weekEnd),
        inArray(tasks.status, ['active', 'completed'])
      )
    )
    .all();

  const overdueTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        lt(tasks.dueDate, todayStart),
        eq(tasks.status, 'active')
      )
    )
    .all();

  const allTasks = [...overdueTasks, ...weekTasks];
  const uniqueTasks = allTasks.filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

  return uniqueTasks as TaskRecord[];
}
