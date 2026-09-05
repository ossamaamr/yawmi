import { View, Text, StyleSheet } from 'react-native';

interface OverdueBadgeProps {
  count: number;
}

export function OverdueBadge({ count }: OverdueBadgeProps) {
  if (count <= 0) return null;

  return (
    <View
      style={styles.badge}
      accessibilityRole="text"
      accessibilityLabel={`${count} مهمة متأخرة`}
    >
      <Text style={styles.text}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
