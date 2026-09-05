import { Tabs } from 'expo-router';
import { Text } from 'react-native';

const PRIMARY = '#6366F1';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: PRIMARY,
        headerTitleStyle: { fontWeight: '700', color: '#1e293b' },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'اليوم',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>📋</Text>
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="week"
        options={{
          title: 'الأسبوع',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>📅</Text>
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'التقدم',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>📊</Text>
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
