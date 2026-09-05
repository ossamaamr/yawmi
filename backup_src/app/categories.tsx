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
import { categories } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import ar from '../src/i18n/ar';
import Footer from '../src/components/Footer';

const PRIMARY = '#6366F1';
const DANGER = '#ef4444';

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

function toArabicNum(num: number): string {
  return num.toString().replace(/\d/g, (d) => ARABIC_DIGITS[parseInt(d)] ?? '');
}

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#64748b', '#78716c',
];

interface CategoryItem {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  sortOrder: number | null;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

export default function CategoriesScreen() {
  const [cats, setCats] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const allCats = await db.select().from(categories).all();
      setCats(
        allCats.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          icon: c.icon,
          sortOrder: c.sortOrder,
        }))
      );
    } catch {
      setCats([]);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [loadCategories])
  );

  const handleAdd = async () => {
    if (!newName.trim()) {
      Alert.alert(ar.errors.invalidInput, ar.errors.requiredField);
      return;
    }
    setAdding(true);
    try {
      const db = await getDatabase();
      await db.insert(categories).values({
        id: generateId(),
        name: newName.trim(),
        color: newColor,
        icon: null,
        sortOrder: cats.length,
        createdAt: Date.now(),
      });
      setNewName('');
      setNewColor(PRESET_COLORS[0]);
      setAdding(false);
      await loadCategories();
    } catch {
      Alert.alert(ar.errors.generic, ar.errors.saveFailed);
      setAdding(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!newName.trim()) {
      Alert.alert(ar.errors.invalidInput, ar.errors.requiredField);
      return;
    }
    setAdding(true);
    try {
      const db = await getDatabase();
      await db
        .update(categories)
        .set({ name: newName.trim(), color: newColor })
        .where(eq(categories.id, id));
      setEditingId(null);
      setNewName('');
      setNewColor(PRESET_COLORS[0]);
      setAdding(false);
      await loadCategories();
    } catch {
      Alert.alert(ar.errors.generic, ar.errors.saveFailed);
      setAdding(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      ar.categories.deleteCategory,
      `${ar.tasks.confirmDelete}\n${name}`,
      [
        { text: ar.buttons.cancel, style: 'cancel' },
        {
          text: ar.buttons.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDatabase();
              await db.delete(categories).where(eq(categories.id, id));
              await loadCategories();
            } catch {
              Alert.alert(ar.errors.generic, ar.errors.deleteFailed);
            }
          },
        },
      ]
    );
  };

  const startEditing = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setNewName(cat.name);
    setNewColor(cat.color || PRESET_COLORS[0]);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewName('');
    setNewColor(PRESET_COLORS[0]);
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
        <View style={styles.inputSection}>
          <Text style={styles.sectionTitle}>
            {editingId ? ar.categories.editCategory : ar.categories.addCategory}
          </Text>
          <View style={styles.addRow}>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              placeholder={ar.categories.addCategory}
              placeholderTextColor="#94a3b8"
              textAlign="right"
            />
            <TouchableOpacity
              style={[styles.colorPreview, { backgroundColor: newColor }]}
              onPress={() => setShowColorPicker(!showColorPicker)}
            />
            <TouchableOpacity
              style={[styles.addButton, adding && styles.addButtonDisabled]}
              onPress={() => (editingId ? handleEdit(editingId) : handleAdd())}
              disabled={adding}
            >
              {adding ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.addButtonText}>
                  {editingId ? ar.buttons.save : ar.buttons.add}
                </Text>
              )}
            </TouchableOpacity>
            {editingId && (
              <TouchableOpacity style={styles.cancelEditButton} onPress={cancelEditing}>
                <Text style={styles.cancelEditText}>{ar.buttons.cancel}</Text>
              </TouchableOpacity>
            )}
          </View>

          {showColorPicker && (
            <View style={styles.colorPicker}>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      newColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => {
                      setNewColor(color);
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>{ar.screens.categories} ({toArabicNum(cats.length)})</Text>
          {cats.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{ar.emptyStates.noCategories}</Text>
              <Text style={styles.emptyDescription}>{ar.emptyStates.noCategoriesDescription}</Text>
            </View>
          ) : (
            cats.map((cat) => (
              <View key={cat.id} style={styles.categoryCard}>
                <View style={styles.categoryContent}>
                  <View style={[styles.colorDot, { backgroundColor: cat.color || PRESET_COLORS[0] }]} />
                  <Text style={styles.categoryName}>{cat.name}</Text>
                </View>
                <View style={styles.categoryActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => startEditing(cat)}
                  >
                    <Text style={styles.editBtnText}>{ar.buttons.edit}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleDelete(cat.id, cat.name)}
                  >
                    <Text style={styles.deleteBtnText}>{ar.buttons.delete}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'right',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  colorPreview: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelEditButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cancelEditText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 14,
  },
  colorPicker: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#1e293b',
    borderWidth: 3,
  },
  listSection: {
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editBtnText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
  },
  deleteBtnText: {
    fontSize: 13,
    color: DANGER,
    fontWeight: '600',
  },
  footerSpacer: {
    height: 100,
  },
});
