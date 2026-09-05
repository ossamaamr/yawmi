import { Platform, Alert } from 'react-native';
import { Paths } from 'expo-file-system';
import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../db/client';

export async function exportData(): Promise<void> {
  try {
    const db = await getDatabase();
    const { tasks: tasksTable, categories: catTable, completionEvents: ceTable } = await import('../db/schema');

    const tasksData = await db.select().from(tasksTable).all();
    const categoriesData = await db.select().from(catTable).all();
    const completionData = await db.select().from(ceTable).all();

    const exportPayload = {
      version: 1,
      exportedAt: Date.now(),
      tasks: tasksData,
      categories: categoriesData,
      completionEvents: completionData,
    };

    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const fileName = `yawmi_backup_${new Date().toISOString().split('T')[0]}.json`;

    if (Platform.OS === 'web') {
      Alert.alert('تصدير', 'التصدير غير متاح على الويب');
      return;
    }

    const file = new File(`${Paths.document}/${fileName}`);
    await file.write(jsonStr);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'تصدير بيانات يومي',
      });
    } else {
      Alert.alert('تم التصدير', `الملف محفوظ في: ${file.uri}`);
    }
  } catch {
    Alert.alert('خطأ', 'فشل في تصدير البيانات');
  }
}

export async function importData(): Promise<void> {
  Alert.alert('استيراد', 'ميزة الاستيراد ستكون متاحة قريباً');
}

export async function resetAllData(): Promise<void> {
  try {
    const db = await getDatabase();
    const {
      tasks: tasksTable,
      categories: catTable,
      completionEvents: ceTable,
      routineItems: riTable,
      recurrenceRules: rrTable,
      reminders: remTable,
      progressionState: psTable,
      progressionEvents: peTable,
      taskOccurrences: toTable,
    } = await import('../db/schema');

    await db.delete(peTable);
    await db.delete(psTable);
    await db.delete(toTable);
    await db.delete(rrTable);
    await db.delete(remTable);
    await db.delete(ceTable);
    await db.delete(riTable);
    await db.delete(tasksTable);
    await db.delete(catTable);
  } catch {
    throw new Error('فشل في حذف البيانات');
  }
}
