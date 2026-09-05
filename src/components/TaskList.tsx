import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Task } from '../features/tasks/domain/task.types';
import { TaskCard } from './TaskCard';
import { EmptyState } from './EmptyState';
import ar from '../i18n/ar';

interface TaskListProps {
  tasks: Task[];
  title: string;
  emptyMessage?: string;
  onTaskPress?: (task: Task) => void;
  onTaskLongPress?: (task: Task) => void;
  showCheckbox?: boolean;
}

export function TaskList({
  tasks,
  title,
  emptyMessage = ar.tasks.noTasks,
  onTaskPress,
  onTaskLongPress,
  showCheckbox = true,
}: TaskListProps) {
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{tasks.length}</Text>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: Task }) => (
    <TaskCard
      task={item}
      onPress={onTaskPress}
      onLongPress={onTaskLongPress}
      showCheckbox={showCheckbox}
    />
  );

  const keyExtractor = (item: Task) => item.id;

  if (tasks.length === 0) {
    return (
      <View style={styles.wrapper}>
        {renderHeader()}
        <EmptyState icon="📋" title={emptyMessage} message="" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'right',
  },
  countBadge: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    minWidth: 28,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 16,
  },
});
