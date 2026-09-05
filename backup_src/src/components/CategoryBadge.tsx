import { View, Text, StyleSheet } from 'react-native';

interface CategoryBadgeProps {
  name: string;
  color?: string;
}

const DEFAULT_COLOR = '#6366F1';

export function CategoryBadge({ name, color = DEFAULT_COLOR }: CategoryBadgeProps) {
  return (
    <View
      style={[styles.badge, { backgroundColor: color + '18' }]}
      accessibilityRole="text"
      accessibilityLabel={name}
    >
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
