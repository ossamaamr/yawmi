import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getDatabase } from '../src/db/client';
import { tasks } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import {
  getRoutineItems,
  addRoutineItem,
  completeRoutineItem,
  uncompleteRoutineItem,
  deleteRoutineItem,
} from '../src/features/routines/application/routine.repository';
import ar from '../src/i18n/ar';
import Footer from '../src/components/Footer';

const PRIMARY = '#6366F1';
const SUCCESS = '#22c55e';

interface RoutineTask {
  id: string;
  title: string;
  itemCount: number;
  completedCount: number;
}

interface RoutineItemData {
  id: string;
  title: string;
  sortOrder: number;
  isCompleted: number;
}

export default function RoutinesScreen() {
  const [routines, setRoutines] = useState<RoutineTask[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [items, setItems] = useState<RoutineItemData[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const loadRoutines = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const allTasks = await db.select().from(tasks).where(eq(tasks.isRoutine, 1)).all();
      
      const routineList: RoutineTask[] = [];
      for (const task of allTasks) {
        const taskItems = await getRoutineItems(task.id);
        routineList.push({
          id: task.id,
          title: task.title,
          itemCount: taskItems.length,
          completedCount: taskItems.filter((i) => i.isCompleted === 1).length,
        });
      }
      setRoutines(routineList);
    } catch {
      setRoutines([]);
    }
    setLoading(false);
  }, []);

  const loadItems = useCallback(async (routineId: string) => {
    try {
      const routineItemsList = await getRoutineItems(routineId);
      setItems(routineItemsList);
    } catch {
      setItems([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [loadRoutines])
  );

  const handleToggleExpand = async (routineId: string) => {
    if (expandedId === routineId) {
      setExpandedId(null);
      setItems([]);
    } else {
      setExpandedId(routineId);
      await loadItems(routineId);
    }
  };

  const handleAddItem = async () => {
    if (!expandedId || !newItemTitle.trim()) return;
    try {
      await addRoutineItem({ routineId: expandedId, title: newItemTitle.trim() });
      setNewItemTitle('');
      await loadItems(expandedId);
      await loadRoutines();
    } catch {
      Alert.alert(ar.errors.generic, ar.errors.saveFailed);
    }
  };

  const handleToggleItem = async (itemId: string, isCompleted: number) => {
    try {
      if (isCompleted === 1) {
        await uncompleteRoutineItem(itemId);
      } else {
        await completeRoutineItem(itemId);
      }
      if (expandedId) {
        await loadItems(expandedId);
        await loadRoutines();
      }
    } catch {
      Alert.alert(ar.errors.generic, ar.errors.saveFailed);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    Alert.alert(ar.tasks.deleteTask, ar.tasks.confirmDelete, [
      { text: ar.buttons.cancel, style: 'cancel' },
      {
        text: ar.buttons.delete,
        style: 'destructive',
        onPress: async () => {
          await deleteRoutineItem(itemId);
          if (expandedId) {
            await loadItems(expandedId);
            await loadRoutines();
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Footer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {routines.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>{ar.emptyStates.noTasks}</Text>
            <Text style={styles.emptyDescription}>أنشئ مهمة جديدة مع خيار الروتين</Text>
          </View>
        ) : (
          routines.map((routine) => (
            <View key={routine.id} style={styles.routineCard}>
              <TouchableOpacity
                style={styles.routineHeader}
                onPress={() => handleToggleExpand(routine.id)}
                activeOpacity={0.7}
              >
                <View style={styles.routineInfo}>
                  <Text style={styles.routineTitle}>{routine.title}</Text>
                  <Text style={styles.routineCount}>
                    {routine.completedCount}/{routine.itemCount} مكتمل
                  </Text>
                </View>
                <View style={styles.routineProgress}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${routine.itemCount > 0 ? (routine.completedCount / routine.itemCount) * 100 : 0}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.expandIcon}>{expandedId === routine.id ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {expandedId === routine.id && (
                <View style={styles.itemsContainer}>
                  {items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <TouchableOpacity
                        style={[styles.itemCheckbox, item.isCompleted === 1 && styles.itemCheckboxChecked]}
                        onPress={() => handleToggleItem(item.id, item.isCompleted)}
                      >
                        {item.isCompleted === 1 && <Text style={styles.checkmark}>✓</Text>}
                      </TouchableOpacity>
                      <Text
                        style={[styles.itemTitle, item.isCompleted === 1 && styles.itemTitleCompleted]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <TouchableOpacity
                        style={styles.itemDelete}
                        onPress={() => handleDeleteItem(item.id)}
                      >
                        <Text style={styles.itemDeleteText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <View style={styles.addItemRow}>
                    <TextInput
                      style={styles.addItemInput}
                      value={newItemTitle}
                      onChangeText={setNewItemTitle}
                      placeholder="إضافة عنصر جديد..."
                      placeholderTextColor="#94a3b8"
                      textAlign="right"
                      onSubmitEditing={handleAddItem}
                      returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.addItemButton} onPress={handleAddItem}>
                      <Text style={styles.addItemButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        )}

        <View style={styles.footerSpacer} />
      </ScrollView>

      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 12 },
  emptyState: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  emptyDescription: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },
  routineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  routineHeader: { padding: 14 },
  routineInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  routineTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', textAlign: 'right', flex: 1 },
  routineCount: { fontSize: 12, color: '#64748b', marginLeft: 8 },
  routineProgress: { height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: SUCCESS, borderRadius: 2 },
  expandIcon: { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8 },
  itemsContainer: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  itemCheckbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1',
    justifyContent: 'center', alignItems: 'center', marginLeft: 10,
  },
  itemCheckboxChecked: { backgroundColor: SUCCESS, borderColor: SUCCESS },
  checkmark: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  itemTitle: { flex: 1, fontSize: 14, color: '#334155', textAlign: 'right', marginRight: 8 },
  itemTitleCompleted: { textDecorationLine: 'line-through', color: '#94a3b8' },
  itemDelete: { paddingHorizontal: 8, paddingVertical: 4 },
  itemDeleteText: { fontSize: 14, color: '#cbd5e1' },
  addItemRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  addItemInput: {
    flex: 1, backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 8, fontSize: 14, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0',
  },
  addItemButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: PRIMARY,
    justifyContent: 'center', alignItems: 'center',
  },
  addItemButtonText: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  footerSpacer: { height: 100 },
});
