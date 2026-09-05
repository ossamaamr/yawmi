import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { createTask, updateTask } from '../../src/features/tasks/application/task.repository';
import { createReminder } from '../../src/features/reminders/application/reminder.repository';
import { createRecurrenceRule } from '../../src/features/recurrence/application/recurrence.repository';
import { createProgressionState } from '../../src/features/progression/application/progression.repository';
import ar from '../../src/i18n/ar';
import Footer from '../../src/components/Footer';
import { scheduleReminder } from '../../src/utils/notification-reminder';

const PRIMARY = '#6366F1';

const PRIORITY_OPTIONS = [
  { value: 0, label: ar.priorities.low },
  { value: 1, label: ar.priorities.medium },
  { value: 2, label: ar.priorities.high },
];

const RECURRENCE_OPTIONS = [
  { value: 'none', label: ar.recurrence.none },
  { value: 'daily', label: ar.recurrence.daily },
  { value: 'weekly', label: ar.recurrence.weekly },
  { value: 'monthly', label: ar.recurrence.monthly },
  { value: 'specific_days', label: ar.recurrence.custom },
];

const DAY_OPTIONS = [
  { value: 0, label: ar.days.sunday },
  { value: 1, label: ar.days.monday },
  { value: 2, label: ar.days.tuesday },
  { value: 3, label: ar.days.wednesday },
  { value: 4, label: ar.days.thursday },
  { value: 5, label: ar.days.friday },
  { value: 6, label: ar.days.saturday },
];

const CATEGORY_OPTIONS = [
  { value: 'personal', label: ar.categories.personal },
  { value: 'work', label: ar.categories.work },
  { value: 'health', label: ar.categories.health },
  { value: 'education', label: ar.categories.education },
  { value: 'shopping', label: ar.categories.shopping },
  { value: 'home', label: ar.categories.home },
  { value: 'finance', label: ar.categories.finance },
  { value: 'social', label: ar.categories.social },
  { value: 'other', label: ar.categories.other },
];

const REMINDER_OPTIONS = [
  { value: 0, label: 'بدون تذكير' },
  { value: 5, label: '5 دقائق قبل' },
  { value: 15, label: '15 دقيقة قبل' },
  { value: 30, label: '30 دقيقة قبل' },
  { value: 60, label: 'ساعة قبل' },
  { value: 1440, label: 'يوم قبل' },
];

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

function toArabicNum(num: number): string {
  return num.toString().replace(/\d/g, (d) => ARABIC_DIGITS[parseInt(d)] ?? '');
}

interface FormData {
  title: string;
  description: string;
  categoryId: string;
  priority: number;
  dueDate: number;
  dueTime: string;
  isAllDay: boolean;
  recurrenceType: string;
  specificDays: number[];
  reminderMinutes: number;
  progressionSteps: string;
}

export default function NewTaskScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ editId?: string }>();
  const isEditing = !!params.editId;

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    categoryId: 'personal',
    priority: 0,
    dueDate: Date.now(),
    dueTime: '',
    isAllDay: true,
    recurrenceType: 'none',
    specificDays: [],
    reminderMinutes: 0,
    progressionSteps: '',
  });
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState(0);

  const MONTH_NAMES = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];

  const daysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert(ar.errors.invalidInput, ar.errors.requiredField);
      return;
    }
    setSaving(true);
    try {
      const dueDateTime = new Date(selectedYear, selectedMonth, selectedDay);
      if (!form.isAllDay && form.dueTime) {
        const parts = form.dueTime.split(':').map(Number);
        const h = parts[0] ?? 0;
        const m = parts[1] ?? 0;
        dueDateTime.setHours(h, m, 0, 0);
      }

      let taskId: string | undefined;

      if (isEditing && params.editId) {
        await updateTask(params.editId, {
          title: form.title.trim(),
          description: form.description.trim(),
          categoryId: form.categoryId,
          priority: form.priority,
          dueDate: dueDateTime.getTime(),
          dueTime: form.isAllDay ? undefined : form.dueTime || undefined,
        });
        taskId = params.editId;
      } else {
        const created = await createTask({
          title: form.title.trim(),
          description: form.description.trim(),
          categoryId: form.categoryId,
          priority: form.priority,
          dueDate: dueDateTime.getTime(),
          dueTime: form.isAllDay ? undefined : form.dueTime || undefined,
          isRecurring: form.recurrenceType !== 'none' ? 1 : 0,
          isProgressive: form.progressionSteps ? 1 : 0,
          isRoutine: 0,
        });
        taskId = created.id;
      }

      if (form.reminderMinutes > 0 && taskId) {
        const scheduledTime = dueDateTime.getTime() - form.reminderMinutes * 60 * 1000;
        const notificationId = await scheduleReminder({
          title: form.title.trim(),
          body: form.description.trim() || 'تذكير',
          scheduledTime,
          data: { taskId },
        });
        await createReminder({
          taskId,
          type: 'minutes_before',
          minutesBefore: form.reminderMinutes,
          scheduledTime,
          notificationId: notificationId ?? undefined,
        });
      }

      if (!isEditing && taskId && form.recurrenceType !== 'none') {
        await createRecurrenceRule({
          taskId,
          type: form.recurrenceType,
          interval: 1,
          daysOfWeek: form.recurrenceType === 'specific_days' ? form.specificDays : undefined,
          startDate: dueDateTime.getTime(),
        });
      }

      if (!isEditing && taskId && form.progressionSteps) {
        const total = parseInt(form.progressionSteps, 10);
        if (!Number.isNaN(total) && total > 0) {
          await createProgressionState({
            taskId,
            currentCursor: 'البداية',
            target: form.title.trim(),
            totalAmount: total,
          });
        }
      }

      router.back();
    } catch {
      Alert.alert(ar.errors.generic, ar.errors.saveFailed);
    }
    setSaving(false);
  };

  const toggleSpecificDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      specificDays: prev.specificDays.includes(day)
        ? prev.specificDays.filter((d) => d !== day)
        : [...prev.specificDays, day],
    }));
  };

  const formatDateDisplay = (): string => {
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const d = new Date(selectedYear, selectedMonth, selectedDay);
    return `${dayNames[d.getDay()]} ${toArabicNum(selectedDay)} ${MONTH_NAMES[selectedMonth]} ${toArabicNum(selectedYear)}`;
  };

  const formatTimeDisplay = (): string => {
    if (form.isAllDay) return ar.time.morning;
    if (!form.dueTime) return '--:--';
    return form.dueTime;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.field}>
          <Text style={styles.label}>{ar.tasks.taskTitle}</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(text) => setForm((p) => ({ ...p, title: text }))}
            placeholder={ar.quickAdd.placeholder}
            placeholderTextColor="#94a3b8"
            textAlign="right"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{ar.tasks.taskDescription}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.description}
            onChangeText={(text) => setForm((p) => ({ ...p, description: text }))}
            placeholder={ar.tasks.taskNotes}
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            textAlign="right"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{ar.tasks.taskCategory}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.chip, form.categoryId === cat.value && styles.chipSelected]}
                  onPress={() => setForm((p) => ({ ...p, categoryId: cat.value }))}
                >
                  <Text style={[styles.chipText, form.categoryId === cat.value && styles.chipTextSelected]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{ar.tasks.taskPriority}</Text>
          <View style={styles.chipRow}>
            {PRIORITY_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, form.priority === opt.value && styles.chipSelected]}
                onPress={() => setForm((p) => ({ ...p, priority: opt.value }))}
              >
                <Text style={[styles.chipText, form.priority === opt.value && styles.chipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{ar.tasks.taskDueDate}</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(!showDatePicker)}>
            <Text style={styles.dateButtonText}>{formatDateDisplay()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <View style={styles.pickerContainer}>
              <View style={styles.pickerRow}>
                <TouchableOpacity style={styles.pickerArrow} onPress={() => setSelectedDay((d) => Math.min(d + 1, daysInMonth(selectedYear, selectedMonth)))}>
                  <Text style={styles.pickerArrowText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.pickerValue}>{toArabicNum(selectedDay)}</Text>
                <TouchableOpacity style={styles.pickerArrow} onPress={() => setSelectedDay((d) => Math.max(d - 1, 1))}>
                  <Text style={styles.pickerArrowText}>-</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerRow}>
                <TouchableOpacity style={styles.pickerArrow} onPress={() => {
                  setSelectedMonth((m) => {
                    const newM = (m + 1) % 12;
                    if (newM === 0) setSelectedYear((y) => y + 1);
                    return newM;
                  });
                }}>
                  <Text style={styles.pickerArrowText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.pickerValue}>{MONTH_NAMES[selectedMonth]}</Text>
                <TouchableOpacity style={styles.pickerArrow} onPress={() => {
                  setSelectedMonth((m) => {
                    const newM = m - 1;
                    if (newM < 0) {
                      setSelectedYear((y) => y - 1);
                      return 11;
                    }
                    return newM;
                  });
                }}>
                  <Text style={styles.pickerArrowText}>-</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerRow}>
                <TouchableOpacity style={styles.pickerArrow} onPress={() => setSelectedYear((y) => y + 1)}>
                  <Text style={styles.pickerArrowText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.pickerValue}>{toArabicNum(selectedYear)}</Text>
                <TouchableOpacity style={styles.pickerArrow} onPress={() => setSelectedYear((y) => y - 1)}>
                  <Text style={styles.pickerArrowText}>-</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View style={styles.field}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>{ar.tasks.taskDueTime}</Text>
            <Switch
              value={!form.isAllDay}
              onValueChange={(val) => setForm((p) => ({ ...p, isAllDay: !val }))}
              trackColor={{ false: '#cbd5e1', true: PRIMARY + '80' }}
              thumbColor={form.isAllDay ? '#f4f3f4' : PRIMARY}
            />
          </View>
          {!form.isAllDay && (
            <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(!showTimePicker)}>
              <Text style={styles.dateButtonText}>{formatTimeDisplay()}</Text>
            </TouchableOpacity>
          )}
          {showTimePicker && !form.isAllDay && (
            <View style={styles.timePickerContainer}>
              <View style={styles.pickerRow}>
                <TouchableOpacity style={styles.pickerArrow} onPress={() => setSelectedHour((h) => (h + 1) % 24)}>
                  <Text style={styles.pickerArrowText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.pickerValue}>{toArabicNum(selectedHour).padStart(2, '٠')}</Text>
                <TouchableOpacity style={styles.pickerArrow} onPress={() => setSelectedHour((h) => (h - 1 + 24) % 24)}>
                  <Text style={styles.pickerArrowText}>-</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.timeSeparator}>:</Text>
              <View style={styles.pickerRow}>
                <TouchableOpacity style={styles.pickerArrow} onPress={() => setSelectedMinute((m) => (m + 5) % 60)}>
                  <Text style={styles.pickerArrowText}>+</Text>
                </TouchableOpacity>
                <Text style={styles.pickerValue}>{toArabicNum(selectedMinute).padStart(2, '٠')}</Text>
                <TouchableOpacity style={styles.pickerArrow} onPress={() => setSelectedMinute((m) => (m - 5 + 60) % 60)}>
                  <Text style={styles.pickerArrowText}>-</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.timeConfirmButton}
                onPress={() => {
                  setForm((p) => ({ ...p, dueTime: `${String(selectedHour).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}` }));
                  setShowTimePicker(false);
                }}
              >
                <Text style={styles.timeConfirmText}>{ar.buttons.done}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{ar.recurrence.none.replace(ar.recurrence.none, 'التكرار')}</Text>
          <View style={styles.chipRow}>
            {RECURRENCE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, form.recurrenceType === opt.value && styles.chipSelected]}
                onPress={() => setForm((p) => ({ ...p, recurrenceType: opt.value }))}
              >
                <Text style={[styles.chipText, form.recurrenceType === opt.value && styles.chipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {form.recurrenceType === 'specific_days' && (
            <View style={styles.specificDaysRow}>
              {DAY_OPTIONS.map((day) => (
                <TouchableOpacity
                  key={day.value}
                  style={[styles.dayChip, form.specificDays.includes(day.value) && styles.dayChipSelected]}
                  onPress={() => toggleSpecificDay(day.value)}
                >
                  <Text style={[styles.dayChipText, form.specificDays.includes(day.value) && styles.dayChipTextSelected]}>
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{ar.reminders.reminderTime}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {REMINDER_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, form.reminderMinutes === opt.value && styles.chipSelected]}
                  onPress={() => setForm((p) => ({ ...p, reminderMinutes: opt.value }))}
                >
                  <Text style={[styles.chipText, form.reminderMinutes === opt.value && styles.chipTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{ar.progression.currentProgress}</Text>
          <TextInput
            style={styles.input}
            value={form.progressionSteps}
            onChangeText={(text) => setForm((p) => ({ ...p, progressionSteps: text }))}
            placeholder="عدد الخطوات (اختياري)"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            textAlign="right"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>{isEditing ? ar.buttons.save : ar.buttons.add}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>{ar.buttons.cancel}</Text>
        </TouchableOpacity>

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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    textAlign: 'right',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  chipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  specificDaysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  dayChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dayChipSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  dayChipText: {
    fontSize: 12,
    color: '#475569',
  },
  dayChipTextSelected: {
    color: '#ffffff',
  },
  dateButton: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateButtonText: {
    fontSize: 15,
    color: '#1e293b',
    textAlign: 'center',
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginVertical: 4,
  },
  pickerArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerArrowText: {
    fontSize: 20,
    fontWeight: '600',
    color: PRIMARY,
  },
  pickerValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    minWidth: 60,
    textAlign: 'center',
  },
  timePickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginVertical: 4,
  },
  timeConfirmButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  timeConfirmText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
  footerSpacer: {
    height: 100,
  },
});
