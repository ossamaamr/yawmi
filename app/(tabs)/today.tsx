import { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTaskStore } from '../../src/state/task-store';
import type { TaskRecord } from '../../src/features/tasks/application/task.repository';
import { startOfDay, addDays } from '../../src/utils/date';
import ar from '../../src/i18n/ar';
import Footer from '../../src/components/Footer';

const PRIMARY = '#6366F1';
const SUCCESS = '#22c55e';
const WARNING = '#f59e0b';
const DANGER = '#ef4444';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

function toArabicNum(num: number): string {
  return num.toString().replace(/\d/g, (d) => ARABIC_DIGITS[parseInt(d)] ?? '');
}

function formatArabicDate(date: Date): string {
  const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];
  const day = dayNames[date.getDay()];
  const dateNum = toArabicNum(date.getDate());
  const month = monthNames[date.getMonth()];
  return `${day} ${dateNum} ${month}`;
}

function getPriorityLabel(priority: number | null): string {
  if (priority === null || priority === 0) return ar.priorities.low;
  if (priority === 1) return ar.priorities.medium;
  return ar.priorities.high;
}

function getPriorityColor(priority: number | null): string {
  if (priority === null || priority === 0) return '#94a3b8';
  if (priority === 1) return WARNING;
  return DANGER;
}

function ProgressRing({ progress, size = 72 }: { progress: number; size?: number }) {
  const pct = Math.min(1, Math.max(0, progress));
  const displayPct = Math.round(pct * 100);
  const ringColor = pct >= 1 ? SUCCESS : pct >= 0.5 ? PRIMARY : WARNING;

  return (
    <View style={[styles.ringOuter, { width: size, height: size, borderRadius: size / 2 }]}>
      <View
        style={[
          styles.ringInner,
          {
            width: size - 10,
            height: size - 10,
            borderRadius: (size - 10) / 2,
            borderColor: ringColor,
          },
        ]}
      />
      <View style={[styles.ringCenter, { width: size - 22, height: size - 22, borderRadius: (size - 22) / 2 }]}>
        <Text style={[styles.ringText, { color: ringColor }]}>{toArabicNum(displayPct)}%</Text>
      </View>
    </View>
  );
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  priority: number | null;
  status: string | null;
  dueDate: number | null;
  dueTime: string | null;
  categoryId: string | null;
  createdAt: number | null;
}

function TaskCard({ task, onComplete, onPress }: { task: TaskItem; onComplete: (id: string) => void; onPress: (id: string) => void }) {
  return (
    <TouchableOpacity style={styles.taskCard} onPress={() => onPress(task.id)} activeOpacity={0.7}>
      <View style={styles.taskCardContent}>
        <TouchableOpacity
          style={[styles.checkbox, task.status === 'completed' && styles.checkboxChecked]}
          onPress={() => onComplete(task.id)}
        >
          {task.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <View style={styles.taskInfo}>
          <Text style={[styles.taskTitle, task.status === 'completed' && styles.taskTitleCompleted]} numberOfLines={1}>
            {task.title || ar.common.untitledTask}
          </Text>
          {task.description ? (
            <Text style={styles.taskDescription} numberOfLines={1}>
              {task.description}
            </Text>
          ) : null}
          <View style={styles.taskMeta}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(task.priority) }]}>
                {getPriorityLabel(task.priority)}
              </Text>
            </View>
            {task.dueTime ? (
              <Text style={styles.dueTime}>{task.dueTime}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

export default function TodayScreen() {
  const router = useRouter();
  const { todayTasks, overdueTasks, completedToday, loading, error, loadTodayTasks, completeTask } = useTaskStore();
  const [refreshing, setRefreshing] = useState(false);

  const mapTask = useCallback((t: TaskRecord): TaskItem => ({
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: t.status,
    dueDate: t.dueDate,
    dueTime: t.dueTime,
    categoryId: t.categoryId,
    createdAt: t.createdAt,
  }), []);

  const loadAllTasks = useCallback(async () => {
    try {
      await loadTodayTasks();
    } catch {
      setRefreshing(false);
    }
  }, [loadTodayTasks]);

  useFocusEffect(
    useCallback(() => {
      loadAllTasks();
    }, [loadAllTasks])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAllTasks();
    setRefreshing(false);
  }, [loadAllTasks]);

  const handleComplete = useCallback(
    async (id: string) => {
      try {
        await completeTask(id);
        await loadAllTasks();
      } catch {
        Alert.alert(ar.errors.generic, ar.errors.saveFailed);
      }
    },
    [completeTask, loadAllTasks]
  );

  const handlePress = useCallback(
    (id: string) => {
      router.push(`/task/${id}`);
    },
    [router]
  );

  const todayStart = useMemo(() => startOfDay(Date.now()), []);
  const tomorrowStart = useMemo(() => addDays(todayStart, 1), [todayStart]);

  const isDueToday = useCallback(
    (t: TaskItem): boolean =>
      t.dueDate !== null && t.dueDate !== undefined && t.dueDate >= todayStart && t.dueDate < tomorrowStart,
    [todayStart, tomorrowStart]
  );

  const allTasks = useMemo(() => {
    const map = new Map<string, TaskItem>();
    const add = (t: TaskRecord) => {
      if (!map.has(t.id)) map.set(t.id, mapTask(t));
    };
    todayTasks.forEach(add);
    overdueTasks.forEach(add);
    completedToday.forEach(add);
    return map;
  }, [todayTasks, overdueTasks, completedToday, mapTask]);

  const activeItems = useMemo(() => [...allTasks.values()].filter((t) => t.status === 'active'), [allTasks]);

  const nowTasks = useMemo(
    () => activeItems.filter((t) => !t.dueTime && isDueToday(t)),
    [activeItems, isDueToday]
  );

  const todayActive = useMemo(
    () => activeItems.filter((t) => t.dueTime && isDueToday(t)),
    [activeItems, isDueToday]
  );

  const overdueActive = useMemo(
    () => activeItems.filter((t) => !isDueToday(t)),
    [activeItems, isDueToday]
  );

  const completedItems = useMemo(
    () => completedToday.map(mapTask),
    [completedToday, mapTask]
  );

  const totalToday = todayActive.length + nowTasks.length;
  const completedCount = completedItems.length;
  const progress = totalToday + completedCount > 0 ? completedCount / (totalToday + completedCount) : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />}
      >
        <View style={styles.header}>
          <Text style={styles.dateText}>{formatArabicDate(new Date())}</Text>
          <ProgressRing progress={progress} />
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={PRIMARY} style={styles.loader} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{ar.errors.generic}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadAllTasks}>
              <Text style={styles.retryText}>{ar.buttons.retry}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {nowTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{ar.time.now}</Text>
                {nowTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onComplete={handleComplete} onPress={handlePress} />
                ))}
              </View>
            )}

            {todayActive.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{ar.time.today}</Text>
                {todayActive.map((task) => (
                  <TaskCard key={task.id} task={task} onComplete={handleComplete} onPress={handlePress} />
                ))}
              </View>
            )}

            {overdueActive.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: DANGER }]}>{ar.screens.overdue}</Text>
                {overdueActive.map((task) => (
                  <TaskCard key={task.id} task={task} onComplete={handleComplete} onPress={handlePress} />
                ))}
              </View>
            )}

            {completedItems.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: SUCCESS }]}>{ar.tasks.completedToday}</Text>
                {completedItems.map((task) => (
                  <TaskCard key={task.id} task={task} onComplete={handleComplete} onPress={handlePress} />
                ))}
              </View>
            )}

            {totalToday === 0 && completedCount === 0 && (
              <EmptyState title={ar.emptyStates.noTasks} description={ar.emptyStates.noTasksDescription} />
            )}
          </>
        )}

        <View style={styles.footerSpacer} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/task/new')} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 48,
    paddingHorizontal: 4,
  },
  dateText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
  },
  ringOuter: {
    borderWidth: 5,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringInner: {
    position: 'absolute',
    borderWidth: 5,
    borderColor: PRIMARY,
  },
  ringCenter: {
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringText: {
    fontSize: 16,
    fontWeight: '700',
  },
  loader: {
    marginTop: 60,
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  errorText: {
    fontSize: 16,
    color: DANGER,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 10,
    textAlign: 'right',
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  taskCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxChecked: {
    backgroundColor: SUCCESS,
    borderColor: SUCCESS,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  taskInfo: {
    flex: 1,
    marginRight: 4,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'right',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskDescription: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dueTime: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 130,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  fabText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '300',
    marginTop: -2,
  },
  footerSpacer: {
    height: 120,
  },
});
