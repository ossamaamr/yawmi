import { getDatabase } from '../../../db/client';
import { tasks, recurrenceRules, reminders, progressionState } from '../../../db/schema';

export interface CreateTaskInput {
  title: string;
  description?: string;
  categoryId?: string;
  projectId?: string;
  subjectId?: string;
  priority?: number;
  dueDate?: number;
  dueTime?: string | null;
  isRecurring?: number;
  isProgressive?: number;
  isRoutine?: number;
  recurrence?: {
    type: string;
    interval?: number;
    daysOfWeek?: number[];
    startDate: number;
    endDate?: number;
  };
  reminder?: {
    type: string;
    minutesBefore?: number;
    scheduledTime: number;
  };
  progression?: {
    currentCursor: string;
    target: string;
    totalAmount: number;
  };
}

export async function createTaskUseCase(input: CreateTaskInput) {
  const db = await getDatabase();
  const now = Date.now();
  const taskId = `task_${now}_${Math.random().toString(36).slice(2, 9)}`;

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(tasks)
      .values({
        id: taskId,
        title: input.title,
        description: input.description ?? null,
        categoryId: input.categoryId ?? null,
        projectId: input.projectId ?? null,
        subjectId: input.subjectId ?? null,
        priority: input.priority ?? 0,
        status: 'active',
        isRecurring: input.isRecurring ?? 0,
        isProgressive: input.isProgressive ?? 0,
        isRoutine: input.isRoutine ?? 0,
        dueDate: input.dueDate ?? null,
        dueTime: input.dueTime ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (input.recurrence) {
      await tx.insert(recurrenceRules).values({
        id: `rr_${now}_${Math.random().toString(36).slice(2, 9)}`,
        taskId,
        type: input.recurrence.type,
        interval: input.recurrence.interval ?? 1,
        daysOfWeek: input.recurrence.daysOfWeek ? JSON.stringify(input.recurrence.daysOfWeek) : null,
        startDate: input.recurrence.startDate,
        endDate: input.recurrence.endDate ?? null,
        createdAt: now,
      });
    }

    if (input.reminder) {
      await tx.insert(reminders).values({
        id: `rem_${now}_${Math.random().toString(36).slice(2, 9)}`,
        taskId,
        type: input.reminder.type,
        minutesBefore: input.reminder.minutesBefore ?? null,
        scheduledTime: input.reminder.scheduledTime,
        isActive: 1,
        snoozedUntil: null,
        notificationId: null,
        createdAt: now,
      });
    }

    if (input.progression) {
      await tx.insert(progressionState).values({
        id: `ps_${now}_${Math.random().toString(36).slice(2, 9)}`,
        taskId,
        currentCursor: input.progression.currentCursor,
        target: input.progression.target,
        completedAmount: 0,
        totalAmount: input.progression.totalAmount,
        status: 'in_progress',
        createdAt: now,
        updatedAt: now,
      });
    }

    return created;
  });
}
