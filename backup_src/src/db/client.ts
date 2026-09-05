import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

export const DB_NAME = 'yawmi.db';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function getDatabase() {
  if (db) return db;
  const sqlite = await SQLite.openDatabaseAsync(DB_NAME);
  db = drizzle(sqlite, { schema });
  return db;
}
