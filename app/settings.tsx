import { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSettingsStore } from '../src/state/settings-store';
import ar from '../src/i18n/ar';
import Footer from '../src/components/Footer';
import { resetAllData, exportData, importData } from '../src/utils/export-import';

const PRIMARY = '#6366F1';
const DANGER = '#ef4444';

const THEME_OPTIONS = [
  { value: 'light' as const, label: ar.settings.lightTheme, icon: '☀️' },
  { value: 'dark' as const, label: ar.settings.darkTheme, icon: '🌙' },
  { value: 'system' as const, label: ar.settings.systemTheme, icon: '📱' },
];

export default function SettingsScreen() {
  const {
    notificationsEnabled,
    theme,
    loadSettings,
    updateSetting,
  } = useSettingsStore();

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleToggleNotifications = async (value: boolean) => {
    await updateSetting('notificationsEnabled', value);
  };

  const handleThemeChange = async (value: 'light' | 'dark' | 'system') => {
    await updateSetting('theme', value);
  };

  const handleResetData = () => {
    Alert.alert(
      ar.settings.resetData,
      ar.settings.confirmReset,
      [
        { text: ar.buttons.cancel, style: 'cancel' },
        {
          text: ar.buttons.confirm,
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAllData();
              Alert.alert(ar.settings.resetData, 'تم حذف جميع البيانات بنجاح');
            } catch {
              Alert.alert(ar.errors.generic, 'فشل في حذف البيانات');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{ar.settings.title}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{ar.settings.general}</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>🔔</Text>
                <Text style={styles.settingLabel}>{ar.settings.enableNotifications}</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: '#cbd5e1', true: PRIMARY + '80' }}
                thumbColor={notificationsEnabled ? PRIMARY : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>🌐</Text>
                <Text style={styles.settingLabel}>{ar.settings.language}</Text>
              </View>
              <View style={styles.valueChip}>
                <Text style={styles.valueText}>{ar.settings.arabic}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{ar.settings.theme}</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.themeCard, theme === opt.value && styles.themeCardSelected]}
                onPress={() => handleThemeChange(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={styles.themeIcon}>{opt.icon}</Text>
                <Text style={[styles.themeLabel, theme === opt.value && styles.themeLabelSelected]}>
                  {opt.label}
                </Text>
                {theme === opt.value && (
                  <View style={styles.themeCheck}>
                    <Text style={styles.themeCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{ar.settings.about}</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>ℹ️</Text>
                <Text style={styles.settingLabel}>{ar.settings.version}</Text>
              </View>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </View>

          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={exportData}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>📤</Text>
                <Text style={styles.settingLabel}>{ar.settings.exportData}</Text>
              </View>
              <Text style={styles.chevron}>‹</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={importData}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>📥</Text>
                <Text style={styles.settingLabel}>{ar.settings.importData}</Text>
              </View>
              <Text style={styles.chevron}>‹</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleResetData}
              activeOpacity={0.7}
            >
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>🗑️</Text>
                <Text style={[styles.settingLabel, { color: DANGER }]}>{ar.settings.resetData}</Text>
              </View>
              <Text style={[styles.chevron, { color: DANGER }]}>‹</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.appName}>{ar.app.name}</Text>
          <Text style={styles.appSubtitle}>{ar.app.subtitle}</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    paddingTop: 48,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 10,
    textAlign: 'right',
  },
  settingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 6,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginLeft: 10,
  },
  settingLabel: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
    marginRight: 8,
    textAlign: 'right',
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: '#64748b',
  },
  valueChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  valueText: {
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 20,
    color: '#cbd5e1',
    fontWeight: '300',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardSelected: {
    borderColor: PRIMARY,
  },
  themeIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  themeLabelSelected: {
    color: PRIMARY,
  },
  themeCheck: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeCheckText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  footerSpacer: {
    height: 100,
  },
});
