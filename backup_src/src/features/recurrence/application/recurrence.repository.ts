import { eq, and } from 'drizzle-orm';
import { getDatabase } from '../../../db/client';
import { recurrenceRules, taskOccurrences } from '../../../db/schema';
import { startOfDay, daysBetween } from '../../../utils/date';

export interface RecurrenceRuleRecord {
  id: string;
  taskId: string;
  type: string;
  interval: number;
  daysOfWeek: string | null;
  startDate: number;
  endDate: number | null;
  createdAt: number;
}

export interface TaskOccurrenceRecord {
  id: string;
  taskId: string;
  dueDate: number;
  status: string;
  completedAt: number | null;
  createdAt: number;
}

export async function createRecurrenceRule(data: {
  taskId: string;
  type: string;
  interval?: number;
  daysOfWeek?: number[];
  startDate: number;
  endDate?: number;
}): Promise<RecurrenceRuleRecord> {
  const db = await getDatabase();
  const id = `rr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const [created] = await db
    .insert(recurrenceRules)
    .values({
      id,
      taskId: data.taskId,
      type: data.type,
      interval: data.interval ?? 1,
      daysOfWeek: data.daysOfWeek ? JSON.stringify(data.daysOfWeek) : null,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      createdAt: Date.now(),
    })
    .returning();

  return created as RecurrenceRuleRecord;
}

export async function getRecurrenceRuleByTaskId(
  taskId: string
): Promise<RecurrenceRuleRecord | undefined> {
  const db = await getDatabase();
  const result = await db
    .select()
    .from(recurrenceRules)
    .where(eq(recurrenceRules.taskId, taskId))
    .get();
  return result as RecurrenceRuleRecord | undefined;
}

function isDueOnDate(
  type: string,
  interval: number,
  daysOfWeek: number[] | null,
  startDate: number,
  endDate: number | null,
  targetDate: number
): boolean {
  const dayStart = startOfDay(targetDate);
  const dayStartRef = startOfDay(startDate);

  if (dayStart < dayStartRef) return false;
  if (endDate && dayStart > endDate) return false;

  const daysDiff = daysBetween(dayStartRef, dayStart);

  switch (type) {
    case 'daily':
      return daysDiff % interval === 0;
    case 'weekly':
      return daysDiff % (7 * interval) === 0;
    case 'monthly': {
      const dateObj = new Date(targetDate);
      const refObj = new Date(startDate);
      const monthsDiff =
        (dateObj.getFullYear() - refObj.getFullYear()) * 12 +
        (dateObj.getMonth() - refObj.getMonth());
      const lastDayOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).getDate();
      const expectedDay = Math.min(refObj.getDate(), lastDayOfMonth);
      return monthsDiff % interval === 0 && dateObj.getDate() === expectedDay;
    }
    case 'yearly': {
      const d = new Date(targetDate);
      const r = new Date(startDate);
      const yearsDiff = d.getFullYear() - r.getFullYear();
      const lastDayOfMonth = new Date(d.getFullYear(), r.getMonth() + 1, 0).getDate();
      const expectedDay = Math.min(r.getDate(), lastDayOfMonth);
      return (
        yearsDiff % interval === 0 &&
        d.getMonth() === r.getMonth() &&
        d.getDate() === expectedDay
      );
    }
    case 'specific_days':
      if (!daysOfWeek) return false;
      const dayOfWeek = new Date(targetDate).getDay();
      return daysOfWeek.includes(dayOfWeek);
    case 'interval_days':
      return daysDiff % interval === 0;
    default:
      return false;
  }
}

export async function generateOccurrencesForDate(
  taskId: string,
  targetDate: number
): Promise<TaskOccurrenceRecord | null> {
  const db = await getDatabase();
  const rule = await getRecurrenceRuleByTaskId(taskId);
  if (!rule) return null;

  const existing = await db
    .select()
    .from(taskOccurrences)
    .where(
      and(
        eq(taskOccurrences.taskId, taskId),
        eq(taskOccurrences.dueDate, startOfDay(targetDate))
      )
    )
    .get();

  if (existing) return existing as TaskOccurrenceRecord;

  const daysOfWeekParsed = rule.daysOfWeek
    ? (JSON.parse(rule.daysOfWeek) as number[])
    : null;

  if (!isDueOnDate(rule.type, rule.interval, daysOfWeekParsed, rule.startDate, rule.endDate, targetDate)) {
    return null;
  }

  const id = `occ_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = Date.now();

  const [created] = await db
    .insert(taskOccurrences)
    .values({
      id,
      taskId,
      dueDate: startOfDay(targetDate),
      status: 'pending',
      completedAt: null,
      createdAt: now,
    })
    .returning();

  return created as TaskOccurrenceRecord;
}

export async function getOccurrencesForDate(
  targetDate: number
): Promise<TaskOccurrenceRecord[]> {
  const db = await getDatabase();
  const dayStart = startOfDay(targetDate);
  const results = await db
    .select()
    .from(taskOccurrences)
    .where(eq(taskOccurrences.dueDate, dayStart))
    .all();
  return results as TaskOccurrenceRecord[];
}

export async function hasOccurrenceForDate(
  taskId: string,
  targetDate: number
): Promise<boolean> {
  const db = await getDatabase();
  const dayStart = startOfDay(targetDate);
  const result = await db
    .select()
    .from(taskOccurrences)
    .where(
      and(
        eq(taskOccurrences.taskId, taskId),
        eq(taskOccurrences.dueDate, dayStart)
      )
    )
    .get();
  return !!result;
}

export async function updateOccurrenceStatus(
  occurrenceId: string,
  status: 'pending' | 'completed' | 'skipped'
): Promise<TaskOccurrenceRecord | undefined> {
  const db = await getDatabase();
  const [updated] = await db
    .update(taskOccurrences)
    .set({
      status,
      completedAt: status === 'completed' ? Date.now() : null,
    })
    .where(eq(taskOccurrences.id, occurrenceId))
    .returning();
  return updated as TaskOccurrenceRecord | undefined;
}
