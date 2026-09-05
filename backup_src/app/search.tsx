import { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getTodayItems, getOverdueTasks } from '../src/features/tasks/application/task.repository';
import ar from '../src/i18n/ar';
import Footer from '../src/components/Footer';

const PRIMARY = '#6366F1';
const WARNING = '#f59e0b';
const DANGER = '#ef4444';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

function toArabicNum(num: number): string {
  return num.toString().replace(/\d/g, (d) => ARABIC_DIGITS[parseInt(d)] ?? '');
}

interface SearchTask {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  priority: number | null;
  status: string | null;
  dueDate: number | null;
  dueTime: string | null;
}

function getPriorityColor(priority: number | null): string {
  if (priority === null || priority === 0) return '#94a3b8';
  if (priority === 1) return WARNING;
  return DANGER;
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [allTasks, setAllTasks] = useState<SearchTask[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllTasks = useCallback(async () => {
    setLoading(true);
    try {
      const [today, overdue] = await Promise.all([getTodayItems(), getOverdueTasks()]);
      const combined = [...overdue, ...today];
      const unique = combined.filter(
        (task, index, self) => index === self.findIndex((t) => t.id === task.id)
      );
      setAllTasks(
        unique.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          categoryId: t.categoryId,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate,
          dueTime: t.dueTime,
        }))
      );
    } catch {
      setAllTasks([]);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAllTasks();
    }, [loadAllTasks])
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return allTasks.filter((task) => {
      const titleMatch = task.title?.toLowerCase().includes(q) ?? false;
      const descMatch = task.description?.toLowerCase().includes(q) ?? false;
      const catMatch = task.categoryId?.toLowerCase().includes(q) ?? false;
      return titleMatch || descMatch || catMatch;
    });
  }, [query, allTasks]);

  const handlePress = (id: string) => {
    Keyboard.dismiss();
    router.push(`/task/${id}`);
  };

  const renderItem = ({ item }: { item: SearchTask }) => (
    <TouchableOpacity style={styles.resultCard} onPress={() => handlePress(item.id)} activeOpacity={0.7}>
      <View style={styles.resultContent}>
        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(item.priority) }]} />
        <View style={styles.resultInfo}>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.title || ar.common.untitledTask}
          </Text>
          {item.description ? (
            <Text style={styles.resultDescription} numberOfLines={1}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.resultMeta}>
            {item.categoryId ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.categoryId}</Text>
              </View>
            ) : null}
            {item.dueTime ? <Text style={styles.dueTime}>{item.dueTime}</Text> : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={ar.search.placeholder}
          placeholderTextColor="#94a3b8"
          autoFocus
          textAlign="right"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setQuery('')}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={PRIMARY} style={styles.loader} />
      ) : query.trim() === '' ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>{ar.search.placeholder}</Text>
          <Text style={styles.emptyDescription}>ابحث في عنوان المهمة أو وصفها أو فئتها</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>{ar.emptyStates.noSearchResults}</Text>
          <Text style={styles.emptyDescription}>{ar.emptyStates.noSearchResultsDescription}</Text>
        </View>
      ) : (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsCount}>
            {toArabicNum(results.length)} نتيجة
          </Text>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  clearButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  loader: {
    marginTop: 60,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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
  resultsContainer: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 13,
    color: '#64748b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textAlign: 'right',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  resultCard: {
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
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 12,
  },
  resultInfo: {
    flex: 1,
    marginRight: 4,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'right',
  },
  resultDescription: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'right',
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: PRIMARY,
  },
  dueTime: {
    fontSize: 12,
    color: '#64748b',
  },
});
