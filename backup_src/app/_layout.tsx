import { useEffect, useState } from 'react';
import { I18nManager, View, StyleSheet, Text } from 'react-native';
import { Stack } from 'expo-router';
import { DeveloperFooter } from '../src/components/DeveloperFooter';
import { ThemeProvider } from '../src/components/ThemeProvider';
import { runMigrations } from '../src/db/migrations';
import { seedDatabase } from '../src/db/seed';
import { configureNotifications } from '../src/utils/notification-reminder';

if (!I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
}

const PRIMARY = '#6366F1';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    I18nManager.forceRTL(true);
    I18nManager.allowRTL(true);
    configureNotifications();
    runMigrations().then(() => seedDatabase()).then(() => setDbReady(true)).catch(() => setDbReady(true));
  }, []);

  if (!dbReady) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 18, color: '#6366F1', fontWeight: '600' }}>يومي</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#ffffff' },
            headerTintColor: PRIMARY,
            headerTitleStyle: { fontWeight: '700', color: '#1e293b' },
            contentStyle: { backgroundColor: '#f8fafc' },
            animation: 'slide_from_left',
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="task/[id]"
            options={{
              title: 'تفاصيل المهمة',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="task/new"
            options={{
              title: 'إضافة مهمة',
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="search"
            options={{
              title: 'بحث',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="categories"
            options={{
              title: 'الفئات',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="routines"
            options={{
              title: 'الروتين',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: 'الإعدادات',
              presentation: 'card',
            }}
          />
        </Stack>
        <DeveloperFooter />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
