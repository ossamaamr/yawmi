import { eq } from 'drizzle-orm';
import { getDatabase } from '../../../db/client';
import { routineItems } from '../../../db/schema';

export interface RoutineItemRecord {
  id: string;
  routineId: string;
  title: string;
  sortOrder: number;
  isCompleted: number;
  createdAt: number;
}

export async function getRoutineItems(routineId: string): Promise<RoutineItemRecord[]> {
  const db = await getDatabase();
  const results = await db
    .select()
    .from(routineItems)
    .where(eq(routineItems.routineId, routineId))
    .all();
  return (results as RoutineItemRecord[]).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function addRoutineItem(data: {
  routineId: string;
  title: string;
  sortOrder?: number;
}): Promise<RoutineItemRecord> {
  const db = await getDatabase();
  const id = `ri_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const existing = await getRoutineItems(data.routineId);
  const maxOrder = existing.reduce((max, item) => Math.max(max, item.sortOrder), -1);

  const [created] = await db
    .insert(routineItems)
    .values({
      id,
      routineId: data.routineId,
      title: data.title,
      sortOrder: data.sortOrder ?? maxOrder + 1,
      isCompleted: 0,
      createdAt: Date.now(),
    })
    .returning();

  return created as RoutineItemRecord;
}

export async function completeRoutineItem(itemId: string): Promise<RoutineItemRecord | undefined> {
  const db = await getDatabase();
  const [updated] = await db
    .update(routineItems)
    .set({ isCompleted: 1 })
    .where(eq(routineItems.id, itemId))
    .returning();
  return updated as RoutineItemRecord | undefined;
}

export async function uncompleteRoutineItem(itemId: string): Promise<RoutineItemRecord | undefined> {
  const db = await getDatabase();
  const [updated] = await db
    .update(routineItems)
    .set({ isCompleted: 0 })
    .where(eq(routineItems.id, itemId))
    .returning();
  return updated as RoutineItemRecord | undefined;
}

export async function updateRoutineItem(
  itemId: string,
  data: Partial<{ title: string; sortOrder: number }>
): Promise<RoutineItemRecord | undefined> {
  const db = await getDatabase();
  const [updated] = await db
    .update(routineItems)
    .set(data)
    .where(eq(routineItems.id, itemId))
    .returning();
  return updated as RoutineItemRecord | undefined;
}

export async function deleteRoutineItem(itemId: string): Promise<void> {
  const db = await getDatabase();
  await db.delete(routineItems).where(eq(routineItems.id, itemId));
}

export async function deleteRoutineItems(routineId: string): Promise<void> {
  const db = await getDatabase();
  await db.delete(routineItems).where(eq(routineItems.routineId, routineId));
}

export async function completeAllRoutineItems(routineId: string): Promise<void> {
  const db = await getDatabase();
  await db
    .update(routineItems)
    .set({ isCompleted: 1 })
    .where(eq(routineItems.routineId, routineId));
}

export async function uncompleteAllRoutineItems(routineId: string): Promise<void> {
  const db = await getDatabase();
  await db
    .update(routineItems)
    .set({ isCompleted: 0 })
    .where(eq(routineItems.routineId, routineId));
}
