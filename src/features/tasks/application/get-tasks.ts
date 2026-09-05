import { eq, and, lt, gte, lte } from 'drizzle-orm';
import { getDatabase } from '../../../db/client';
import { tasks, taskOccurrences, recurrenceRules } from '../../../db/schema';
import { startOfDay, endOfDay, addDays } from '../../../utils/date';
import { isDueOnDate } from '../../recurrence/domain/recurrence.entity';
import { RecurrenceRule } from '../../recurrence/domain/recurrence.types';

function rowToRule(row: { id: string; taskId: string; type: string; interval: number | null; daysOfWeek: string | null; startDate: number; endDate: number | null; createdAt: number | null }): RecurrenceRule {
  return {
    id: row.id,
    type: row.type as RecurrenceRule['type'],
    interval: row.interval ?? 1,
    daysOfWeek: row.daysOfWeek ? JSON.parse(row.daysOfWeek) as number[] : [],
    dayOfMonth: null,
    monthOfYear: null,
    startDate: row.startDate,
    endDate: row.endDate,
    maxOccurrences: null,
    createdAt: row.createdAt ?? 0,
    updatedAt: row.createdAt ?? 0,
  };
}

export async function getTodayItems() {
  const db = await getDatabase();
  const todayStart = startOfDay(Date.now());
  const todayEnd = endOfDay(Date.now());

  const directTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        gte(tasks.dueDate, todayStart),
        lte(tasks.dueDate, todayEnd),
        eq(tasks.status, 'active')
      )
    )
    .all();

  const recurringTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.isRecurring, 1), eq(tasks.status, 'active')))
    .all();

  for (const rt of recurringTasks) {
    const ruleRow = await db
      .select()
      .from(recurrenceRules)
      .where(eq(recurrenceRules.taskId, rt.id))
      .get();

    if (ruleRow) {
      const rule = rowToRule(ruleRow);
      const isDue = isDueOnDate(rule, todayStart);

      if (isDue) {
        const existing = await db
          .select()
          .from(taskOccurrences)
          .where(and(eq(taskOccurrences.taskId, rt.id), eq(taskOccurrences.dueDate, todayStart)))
          .get();

        if (!existing) {
          await db.insert(taskOccurrences).values({
            id: `occ_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
            taskId: rt.id,
            dueDate: todayStart,
            status: 'pending',
            completedAt: null,
            createdAt: Date.now(),
          });
        }
      }
    }

    if (!directTasks.find((t) => t.id === rt.id)) {
      directTasks.push(rt);
    }
  }

  const progressiveTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.isProgressive, 1), eq(tasks.status, 'active')))
    .all();

  for (const pt of progressiveTasks) {
    if (!directTasks.find((t) => t.id === pt.id)) {
      directTasks.push(pt);
    }
  }

  return directTasks;
}

export async function getOverdueTasks() {
  const db = await getDatabase();
  const todayStart = startOfDay(Date.now());
  return db
    .select()
    .from(tasks)
    .where(and(lt(tasks.dueDate, todayStart), eq(tasks.status, 'active')))
    .all();
}

export async function getWeekItems() {
  const db = await getDatabase();
  const todayStart = startOfDay(Date.now());
  const weekEnd = endOfDay(addDays(todayStart, 6));
  return db
    .select()
    .from(tasks)
    .where(
      and(
        gte(tasks.dueDate, todayStart),
        lte(tasks.dueDate, weekEnd),
        eq(tasks.status, 'active')
      )
    )
    .all();
}

export async function getTaskById(id: string) {
  const db = await getDatabase();
  return db.select().from(tasks).where(eq(tasks.id, id)).get();
}
