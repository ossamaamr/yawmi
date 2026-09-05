import { eq, and, gt, lt } from 'drizzle-orm';
import { getDatabase } from '../../../db/client';
import { reminders } from '../../../db/schema';

export interface ReminderRecord {
  id: string;
  taskId: string;
  type: string;
  minutesBefore: number | null;
  scheduledTime: number;
  isActive: number;
  snoozedUntil: number | null;
  notificationId: string | null;
  createdAt: number;
}

export async function createReminder(data: {
  taskId: string;
  type: string;
  minutesBefore?: number;
  scheduledTime: number;
  notificationId?: string;
}): Promise<ReminderRecord> {
  const db = await getDatabase();
  const id = `rem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const [created] = await db
    .insert(reminders)
    .values({
      id,
      taskId: data.taskId,
      type: data.type,
      minutesBefore: data.minutesBefore ?? null,
      scheduledTime: data.scheduledTime,
      isActive: 1,
      snoozedUntil: null,
      notificationId: data.notificationId ?? null,
      createdAt: Date.now(),
    })
    .returning();

  return created as ReminderRecord;
}

export async function getActiveReminders(): Promise<ReminderRecord[]> {
  const db = await getDatabase();
  const now = Date.now();
  const results = await db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.isActive, 1),
        gt(reminders.scheduledTime, now)
      )
    )
    .all();
  return results as ReminderRecord[];
}

export async function getRemindersForTask(taskId: string): Promise<ReminderRecord[]> {
  const db = await getDatabase();
  const results = await db
    .select()
    .from(reminders)
    .where(eq(reminders.taskId, taskId))
    .all();
  return results as ReminderRecord[];
}

export async function cancelReminder(id: string): Promise<void> {
  const db = await getDatabase();
  await db
    .update(reminders)
    .set({ isActive: 0 })
    .where(eq(reminders.id, id));
}

export async function snoozeReminder(
  id: string,
  snoozeMinutes: number
): Promise<ReminderRecord | undefined> {
  const db = await getDatabase();
  const snoozedUntil = Date.now() + snoozeMinutes * 60 * 1000;

  const [updated] = await db
    .update(reminders)
    .set({
      snoozedUntil,
      scheduledTime: snoozedUntil,
    })
    .where(eq(reminders.id, id))
    .returning();

  return updated as ReminderRecord | undefined;
}

export async function cancelRemindersForTask(taskId: string): Promise<void> {
  const db = await getDatabase();
  await db
    .update(reminders)
    .set({ isActive: 0 })
    .where(eq(reminders.taskId, taskId));
}

export async function rescheduleRemindersAfterReboot(): Promise<ReminderRecord[]> {
  const db = await getDatabase();
  const now = Date.now();

  const snoozedReminders = await db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.isActive, 1),
        lt(reminders.scheduledTime, now)
      )
    )
    .all();

  const updatedReminders: ReminderRecord[] = [];

  for (const reminder of snoozedReminders) {
    if (reminder.snoozedUntil && reminder.snoozedUntil > now) {
      const [updated] = await db
        .update(reminders)
        .set({ scheduledTime: reminder.snoozedUntil })
        .where(eq(reminders.id, reminder.id))
        .returning();

      if (updated) {
        updatedReminders.push(updated as ReminderRecord);
      }
    }
  }

  return updatedReminders;
}
