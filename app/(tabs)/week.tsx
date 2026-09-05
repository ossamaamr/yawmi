import { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getWeekItems } from '../../src/features/tasks/application/task.repository';
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

const DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAY_NAMES_SHORT = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

interface WeekTask {
  id: string;
  title: string;
  description: string | null;
  priority: number | null;
  status: string | null;
  dueDate: number | null;
  dueTime: string | null;
  categoryId: string | null;
}

function startOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function getWeekDates(centerDate: Date): Date[] {
  const dates: Date[] = [];
  const start = new Date(centerDate);
  start.setDate(start.getDate() - start.getDay());
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function getPriorityColor(priority: number | null): string {
  if (priority === null || priority === 0) return '#94a3b8';
  if (priority === 1) return WARNING;
  return DANGER;
}

function getPriorityLabel(priority: number | null): string {
  if (priority === null || priority === 0) return ar.priorities.low;
  if (priority === 1) return ar.priorities.medium;
  return ar.priorities.high;
}

export default function WeekScreen() {
  const router = useRouter();
  const [allTasks, setAllTasks] = useState<WeekTask[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  const weekDates = useMemo(() => getWeekDates(new Date()), []);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const tasks = await getWeekItems();
      setAllTasks(
        tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate,
          dueTime: t.dueTime,
          categoryId: t.categoryId,
        }))
      );
    } catch {
      setAllTasks([]);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  const tasksForSelectedDay = useMemo(() => {
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);
    return allTasks.filter((t) => {
      if (!t.dueDate) return false;
      return t.dueDate >= dayStart && t.dueDate <= dayEnd;
    });
  }, [allTasks, selectedDate]);

  const getTaskCountForDate = useCallback(
    (date: Date): number => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      return allTasks.filter((t) => {
        if (!t.dueDate) return false;
        return t.dueDate >= dayStart && t.dueDate <= dayEnd;
      }).length;
    },
    [allTasks]
  );

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date): boolean => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handlePress = (id: string) => {
    router.push(`/task/${id}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{ar.screens.week}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
          <View style={styles.daysRow}>
            {weekDates.map((date, index) => {
              const count = getTaskCountForDate(date);
              const today = isToday(date);
              const selected = isSelected(date);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCard,
                    today && styles.dayCardToday,
                    selected && styles.dayCardSelected,
                  ]}
                  onPress={() => setSelectedDate(date)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayName, selected && styles.dayNameSelected]}>
                    {DAY_NAMES_SHORT[date.getDay()]}
                  </Text>
                  <Text style={[styles.dayNumber, selected && styles.dayNumberSelected, today && styles.dayNumberToday]}>
                    {toArabicNum(date.getDate())}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.countBadge, selected && styles.countBadgeSelected]}>
                      <Text style={[styles.countText, selected && styles.countTextSelected]}>
                        {toArabicNum(count)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.selectedDateInfo}>
          <Text style={styles.selectedDateText}>
            {DAY_NAMES[selectedDate.getDay()]} {toArabicNum(selectedDate.getDate())}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={PRIMARY} style={styles.loader} />
        ) : tasksForSelectedDay.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{ar.tasks.noTasks}</Text>
            <Text style={styles.emptyDescription}>{ar.emptyStates.noTasksDescription}</Text>
          </View>
        ) : (
          <View style={styles.taskList}>
            {tasksForSelectedDay.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskCard}
                onPress={() => handlePress(task.id)}
                activeOpacity={0.7}
              >
                <View style={styles.taskCardContent}>
                  <View style={[styles.statusDot, { backgroundColor: task.status === 'completed' ? SUCCESS : getPriorityColor(task.priority) }]} />
                  <View style={styles.taskInfo}>
                    <Text
                      style={[styles.taskTitle, task.status === 'completed' && styles.taskTitleCompleted]}
                      numberOfLines={1}
                    >
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
                      {task.dueTime ? <Text style={styles.dueTime}>{task.dueTime}</Text> : null}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.footerSpacer} />
      </ScrollView>

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
    paddingTop: 12,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'right',
  },
  daysScroll: {
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayCard: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    minWidth: 60,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dayCardToday: {
    borderWidth: 1.5,
    borderColor: PRIMARY,
  },
  dayCardSelected: {
    backgroundColor: PRIMARY,
  },
  dayName: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  dayNameSelected: {
    color: '#ffffff',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  dayNumberSelected: {
    color: '#ffffff',
  },
  dayNumberToday: {
    color: PRIMARY,
  },
  countBadge: {
    marginTop: 4,
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
    color: PRIMARY,
  },
  countTextSelected: {
    color: '#ffffff',
  },
  selectedDateInfo: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'right',
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
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
  taskList: {
    paddingHorizontal: 16,
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
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 12,
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
  footerSpacer: {
    height: 100,
  },
});
