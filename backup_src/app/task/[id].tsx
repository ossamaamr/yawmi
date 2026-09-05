import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { getTaskById, completeTask, deleteTask } from '../../src/features/tasks/application/task.repository';
import ar from '../../src/i18n/ar';
import Footer from '../../src/components/Footer';
import { cancelReminder } from '../../src/utils/notification-reminder';
import { getDatabase } from '../../src/db/client';
import { reminders } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

const PRIMARY = '#6366F1';
const SUCCESS = '#22c55e';
const WARNING = '#f59e0b';
const DANGER = '#ef4444';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

function toArabicNum(num: number): string {
  return num.toString().replace(/\d/g, (d) => ARABIC_DIGITS[parseInt(d)] ?? '');
}

const PRIORITY_LABELS: Record<string, string> = {
  '0': ar.priorities.low,
  '1': ar.priorities.medium,
  '2': ar.priorities.high,
};

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  priority: number | null;
  status: string | null;
  isRecurring: number | null;
  isProgressive: number | null;
  dueDate: number | null;
  dueTime: string | null;
  createdAt: number | null;
  updatedAt: number | null;
}

function formatDate(timestamp: number | null): string {
  if (!timestamp) return ar.common.unknown;
  const d = new Date(timestamp);
  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];
  const day = dayNames[d.getDay()];
  const dateNum = toArabicNum(d.getDate());
  const month = monthNames[d.getMonth()];
  return `${day} ${dateNum} ${month} ${toArabicNum(d.getFullYear())}`;
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadTask = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const found = await getTaskById(id);
      if (found) {
        setTask({
          id: found.id,
          title: found.title,
          description: found.description,
          categoryId: found.categoryId,
          priority: found.priority,
          status: found.status,
          isRecurring: found.isRecurring,
          isProgressive: found.isProgressive,
          dueDate: found.dueDate,
          dueTime: found.dueTime,
          createdAt: found.createdAt,
          updatedAt: found.updatedAt,
        });
      }
    } catch {
      setTask(null);
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadTask();
    }, [loadTask])
  );

  const handleComplete = async () => {
    if (!id || completing) return;
    setCompleting(true);
    try {
      await completeTask(id);
      Alert.alert(ar.tasks.taskCompletedSuccessfully, '', [{ text: ar.buttons.done }]);
      await loadTask();
    } catch {
      Alert.alert(ar.errors.generic, ar.errors.saveFailed);
    }
    setCompleting(false);
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      ar.tasks.deleteTask,
      ar.tasks.confirmDelete,
      [
        { text: ar.buttons.cancel, style: 'cancel' },
        {
          text: ar.buttons.delete,
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const db = await getDatabase();
              const taskReminders = await db.select().from(reminders).where(eq(reminders.taskId, id)).all();
              for (const rem of taskReminders) {
                await cancelReminder(rem.notificationId);
              }
              await deleteTask(id);
              router.back();
            } catch {
              Alert.alert(ar.errors.generic, ar.errors.deleteFailed);
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundText}>{ar.errors.taskNotFound}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{ar.buttons.back}</Text>
        </TouchableOpacity>
        <Footer />
      </View>
    );
  }

  const isActive = task.status === 'active';
  const isCompleted = task.status === 'completed';
  const priorityKey = String(task.priority ?? 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusBanner}>
          <Text style={[styles.statusText, isCompleted ? styles.statusCompleted : styles.statusActive]}>
            {isCompleted ? ar.tasks.completedTasks : ar.tasks.pendingTasks}
          </Text>
        </View>

        <Text style={styles.title}>{task.title || ar.common.untitledTask}</Text>

        {task.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{ar.tasks.taskDescription}</Text>
            <Text style={styles.descriptionText}>{task.description}</Text>
          </View>
        ) : null}

        <View style={styles.infoGrid}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{ar.tasks.taskPriority}</Text>
            <View style={[styles.infoBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
              <Text style={[styles.infoBadgeText, { color: getPriorityColor(task.priority) }]}>
                {PRIORITY_LABELS[priorityKey] || ar.priorities.low}
              </Text>
            </View>
          </View>

          {task.categoryId ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{ar.tasks.taskCategory}</Text>
              <Text style={styles.infoValue}>{task.categoryId}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{ar.tasks.taskDueDate}</Text>
            <Text style={styles.infoValue}>{formatDate(task.dueDate)}</Text>
          </View>

          {task.dueTime ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{ar.tasks.taskDueTime}</Text>
              <Text style={styles.infoValue}>{task.dueTime}</Text>
            </View>
          ) : null}

          {task.isRecurring === 1 ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{ar.recurrence.none}</Text>
              <Text style={styles.infoValue}>{ar.recurrence.custom}</Text>
            </View>
          ) : null}

          {task.isProgressive === 1 ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{ar.progression.currentProgress}</Text>
              <Text style={styles.infoValue}>{ar.progression.keepGoing}</Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{ar.settings.version}</Text>
            <Text style={styles.infoValue}>{formatDate(task.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {isActive ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={handleComplete}
              disabled={completing}
              activeOpacity={0.7}
            >
              {completing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.completeButtonText}>✓ {ar.tasks.completeTask}</Text>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => router.push({ pathname: '/task/new', params: { editId: id } })}
            activeOpacity={0.7}
          >
            <Text style={styles.editButtonText}>{ar.buttons.edit}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
            disabled={deleting}
            activeOpacity={0.7}
          >
            {deleting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.deleteButtonText}>{ar.buttons.delete}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      <Footer />
    </View>
  );
}

function getPriorityColor(priority: number | null): string {
  if (priority === null || priority === 0) return '#94a3b8';
  if (priority === 1) return WARNING;
  return DANGER;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  notFoundText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  statusBanner: {
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  statusCompleted: {
    backgroundColor: SUCCESS + '20',
    color: SUCCESS,
  },
  statusActive: {
    backgroundColor: PRIMARY + '20',
    color: PRIMARY,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'right',
    marginBottom: 20,
    lineHeight: 34,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
    textAlign: 'right',
  },
  descriptionText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
    textAlign: 'right',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 10,
  },
  infoGrid: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  infoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  infoBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: SUCCESS,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  editButton: {
    backgroundColor: PRIMARY,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: DANGER,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footerSpacer: {
    height: 100,
  },
});
