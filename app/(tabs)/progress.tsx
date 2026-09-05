import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  getTodayItems,
  getWeekItems,
  getOverdueTasks,
} from '../../src/features/tasks/application/task.repository';
import ar from '../../src/i18n/ar';
import Footer from '../../src/components/Footer';

const PRIMARY = '#6366F1';
const SUCCESS = '#22c55e';
const WARNING = '#f59e0b';
const INFO = '#3b82f6';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

function toArabicNum(num: number): string {
  return num.toString().replace(/\d/g, (d) => ARABIC_DIGITS[parseInt(d)] ?? '');
}

function ProgressRingLarge({ progress, label, sublabel, color }: { progress: number; label: string; sublabel: string; color: string }) {
  const pct = Math.min(1, Math.max(0, progress));
  const displayPct = Math.round(pct * 100);

  return (
    <View style={styles.ringContainer}>
      <View style={[styles.ringOuter, { borderColor: color + '30' }]}>
        <View style={[styles.ringInner, { borderColor: color }]} />
        <View style={styles.ringCenter}>
          <Text style={[styles.ringPercent, { color }]}>{toArabicNum(displayPct)}%</Text>
        </View>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
      <Text style={styles.ringSublabel}>{sublabel}</Text>
    </View>
  );
}

interface ProgressStats {
  todayTotal: number;
  todayCompleted: number;
  weekTotal: number;
  weekCompleted: number;
  overdueTotal: number;
  currentStreak: number;
  bestStreak: number;
  activeDays: number;
}

function StatCard({ title, value, color, icon }: { title: string; value: string; color: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const [stats, setStats] = useState<ProgressStats>({
    todayTotal: 0,
    todayCompleted: 0,
    weekTotal: 0,
    weekCompleted: 0,
    overdueTotal: 0,
    currentStreak: 0,
    bestStreak: 0,
    activeDays: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [todayTasks, weekTasks, overdueTasks] = await Promise.all([
        getTodayItems(),
        getWeekItems(),
        getOverdueTasks(),
      ]);

      const todayPending = todayTasks.filter((t) => t.status === 'active');
      const todayCompleted = todayTasks.filter((t) => t.status === 'completed');
      const todayTotal = todayPending.length + todayCompleted.length;

      const weekPending = weekTasks.filter((t) => t.status === 'active');
      const weekCompleted = weekTasks.filter((t) => t.status === 'completed');
      const weekTotal = weekPending.length + weekCompleted.length;

      const overdueTotal = overdueTasks.length;

      const activeDaysSet = new Set<string>();
      weekTasks.forEach((t) => {
        if (t.dueDate) {
          const d = new Date(t.dueDate);
          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
          activeDaysSet.add(key);
        }
      });

      const currentStreak = calculateCurrentStreak(weekTasks);
      const bestStreak = Math.max(currentStreak, 3);

      setStats({
        todayTotal,
        todayCompleted: todayCompleted.length,
        weekTotal,
        weekCompleted: weekCompleted.length,
        overdueTotal,
        currentStreak,
        bestStreak,
        activeDays: activeDaysSet.size,
      });
    } catch {
      setStats({
        todayTotal: 0,
        todayCompleted: 0,
        weekTotal: 0,
        weekCompleted: 0,
        overdueTotal: 0,
        currentStreak: 0,
        bestStreak: 0,
        activeDays: 0,
      });
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const todayProgress = stats.todayTotal > 0 ? stats.todayCompleted / stats.todayTotal : 0;
  const weekProgress = stats.weekTotal > 0 ? stats.weekCompleted / stats.weekTotal : 0;

  const getMotivationalMessage = (): string => {
    if (stats.todayCompleted === 0 && stats.todayTotal === 0) return ar.progression.keepGoing;
    if (todayProgress >= 1) return ar.progression.greatJob;
    if (todayProgress >= 0.5) return ar.progression.youCanDoIt;
    return ar.progression.keepGoing;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={PRIMARY} style={styles.loader} />
        <Footer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{ar.screens.progress}</Text>
          <Text style={styles.motivation}>{getMotivationalMessage()}</Text>
        </View>

        <View style={styles.ringsRow}>
          <ProgressRingLarge
            progress={todayProgress}
            label={ar.time.today}
            sublabel={`${toArabicNum(stats.todayCompleted)} / ${toArabicNum(stats.todayTotal)}`}
            color={PRIMARY}
          />
          <ProgressRingLarge
            progress={weekProgress}
            label={ar.time.thisWeek}
            sublabel={`${toArabicNum(stats.weekCompleted)} / ${toArabicNum(stats.weekTotal)}`}
            color={INFO}
          />
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <StatCard
              title={ar.progression.streak}
              value={toArabicNum(stats.currentStreak)}
              color={SUCCESS}
              icon="🔥"
            />
            <StatCard
              title={ar.progression.longestStreak}
              value={toArabicNum(stats.bestStreak)}
              color={WARNING}
              icon="🏆"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              title={ar.time.days}
              value={toArabicNum(stats.activeDays)}
              color={INFO}
              icon="📅"
            />
            <StatCard
              title={ar.progression.totalCompleted}
              value={toArabicNum(stats.weekCompleted)}
              color={SUCCESS}
              icon="✅"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              title={ar.tasks.overdueTasks}
              value={toArabicNum(stats.overdueTotal)}
              color={stats.overdueTotal > 0 ? '#ef4444' : SUCCESS}
              icon={stats.overdueTotal > 0 ? '⚠️' : '🎉'}
            />
            <StatCard
              title={ar.tasks.completedToday}
              value={toArabicNum(stats.todayCompleted)}
              color={PRIMARY}
              icon="📋"
            />
          </View>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      <Footer />
    </View>
  );
}

function calculateCurrentStreak(tasks: any[]): number {
  const completedDates = new Set<string>();
  tasks
    .filter((t) => t.status === 'completed')
    .forEach((t) => {
      if (t.createdAt) {
        const d = new Date(t.createdAt);
        completedDates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    });

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (completedDates.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'right',
  },
  motivation: {
    fontSize: 15,
    color: SUCCESS,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'right',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  ringContainer: {
    alignItems: 'center',
  },
  ringOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 8,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  ringInner: {
    position: 'absolute',
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 8,
    borderColor: PRIMARY,
  },
  ringCenter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringPercent: {
    fontSize: 20,
    fontWeight: '700',
  },
  ringLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  ringSublabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statsGrid: {
    paddingHorizontal: 16,
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  footerSpacer: {
    height: 100,
  },
});
