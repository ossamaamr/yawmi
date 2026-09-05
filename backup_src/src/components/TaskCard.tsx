import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Task, Priority } from '../features/tasks/domain/task.types';
import ar from '../i18n/ar';

interface TaskCardProps {
  task: Task;
  onPress?: (task: Task) => void;
  onLongPress?: (task: Task) => void;
  showCheckbox?: boolean;
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#10B981',
  none: '#D1D5DB',
};

const CATEGORY_COLORS: Record<string, string> = {
  'شخصي': '#6366F1',
  'عمل': '#3B82F6',
  'صحة': '#10B981',
  'تعليم': '#8B5CF6',
  'تسوق': '#F59E0B',
  'منزل': '#EC4899',
  'أموال': '#14B8A6',
  'اجتماعي': '#F97316',
  'أخرى': '#6B7280',
};

export function TaskCard({ task, onPress, onLongPress, showCheckbox = true }: TaskCardProps) {
  const priorityColor = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.none;
  const categoryKey = task.tags[0];
  const categoryLabel = categoryKey || ar.categories.other;
  const categoryColor = CATEGORY_COLORS[categoryLabel] || '#6B7280';

  const formatTime = (time: string | null): string | null => {
    if (!time) return null;
    return time;
  };

  const formattedTime = formatTime(task.dueTime);

  return (
    <TouchableOpacity
      style={[styles.container, task.status === 'completed' && styles.completedContainer]}
      onPress={() => onPress?.(task)}
      onLongPress={() => onLongPress?.(task)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}${formattedTime ? `, ${formattedTime}` : ''}, ${task.priority !== 'none' ? ar.priorities[task.priority] : ''}`}
    >
      {showCheckbox && (
        <View style={[styles.checkbox, task.status === 'completed' && styles.checkboxChecked]}>
          {task.status === 'completed' && <Text style={styles.checkmark}>✓</Text>}
        </View>
      )}

      <View style={styles.content}>
        <Text
          style={[styles.title, task.status === 'completed' && styles.titleCompleted]}
          numberOfLines={1}
        >
          {task.title}
        </Text>

        <View style={styles.metaRow}>
          {formattedTime && (
            <Text style={styles.time}>{formattedTime}</Text>
          )}

          {task.tags.length > 0 && (
            <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {categoryLabel}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  completedContainer: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
});
