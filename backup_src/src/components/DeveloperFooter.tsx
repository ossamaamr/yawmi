import { View, Text, StyleSheet } from 'react-native';

export function DeveloperFooter() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>تطوير: أسامة بن عمرو السَّروجيّ</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  text: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
