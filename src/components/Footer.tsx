import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import ar from '../i18n/ar';

const PRIMARY = '#6366F1';

interface NavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
}

const navItems: NavItem[] = [
  { key: 'today', label: ar.screens.today, icon: '🏠', path: '/' },
  { key: 'week', label: ar.screens.week, icon: '📅', path: '/(tabs)/week' },
  { key: 'progress', label: ar.screens.progress, icon: '📊', path: '/(tabs)/progress' },
  { key: 'search', label: ar.search.placeholder.replace('...', '').trim(), icon: '🔍', path: '/search' },
  { key: 'categories', label: ar.screens.categories, icon: '📁', path: '/categories' },
  { key: 'settings', label: ar.screens.settings, icon: '⚙️', path: '/settings' },
];

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string): boolean => {
    if (path === '/') {
      return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/today';
    }
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <View style={styles.container}>
      {navItems.map((item) => {
        const active = isActive(item.path);
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.item}
            onPress={() => {
              if (item.path === '/') {
                router.push('/(tabs)');
              } else {
                router.push(item.path as any);
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={[styles.label, active && styles.activeLabel]} numberOfLines={1}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    minWidth: 52,
  },
  icon: {
    fontSize: 18,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  activeLabel: {
    color: PRIMARY,
    fontWeight: '700',
  },
});
