import { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import ar from '../i18n/ar';

interface ParsedResult {
  title: string;
  priority: 'none' | 'low' | 'medium' | 'high';
  tags: string[];
}

interface QuickAddBarProps {
  onSubmit?: (result: ParsedResult) => void;
  onCancel?: () => void;
}

function parseQuickAdd(input: string): ParsedResult {
  let title = input.trim();
  let priority: ParsedResult['priority'] = 'none';
  const tags: string[] = [];

  const priorityMatch = title.match(/!(عالية|منخفضة|متوسطة|high|low|medium)/i);
  if (priorityMatch) {
    const p = priorityMatch[1]!.toLowerCase();
    if (p === 'عالية' || p === 'high') priority = 'high';
    else if (p === 'متوسطة' || p === 'medium') priority = 'medium';
    else if (p === 'منخفضة' || p === 'low') priority = 'low';
    title = title.replace(priorityMatch[0], '').trim();
  }

  const tagMatches = title.match(/#[^\s#]+/g);
  if (tagMatches) {
    tagMatches.forEach((tag) => {
      tags.push(tag.slice(1));
    });
    title = title.replace(/#[^\s#]+/g, '').trim();
  }

  return { title, priority, tags };
}

export function QuickAddBar({ onSubmit, onCancel }: QuickAddBarProps) {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<ParsedResult | null>(null);

  const handleChangeText = useCallback((text: string) => {
    setInput(text);
    if (text.trim().length > 0) {
      setParsed(parseQuickAdd(text));
    } else {
      setParsed(null);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    const result = parseQuickAdd(input);
    onSubmit?.(result);
    setInput('');
    setParsed(null);
  }, [input, onSubmit]);

  const handleCancel = useCallback(() => {
    setInput('');
    setParsed(null);
    onCancel?.();
  }, [onCancel]);

  const priorityLabels: Record<string, string> = {
    high: ar.priorities.high,
    medium: ar.priorities.medium,
    low: ar.priorities.low,
    none: '',
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={handleChangeText}
          placeholder={ar.quickAdd.placeholder}
          placeholderTextColor="#9CA3AF"
          textAlign="right"
          accessibilityLabel={ar.quickAdd.placeholder}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        {input.length > 0 && (
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} accessibilityLabel={ar.quickAdd.cancel}>
            <Text style={styles.cancelText}>✕</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={handleSubmit}
          disabled={!input.trim()}
          accessibilityLabel={ar.quickAdd.add}
        >
          <Text style={styles.sendText}>↑</Text>
        </TouchableOpacity>
      </View>

      {parsed && parsed.title.length > 0 && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle} numberOfLines={1}>
            {parsed.title}
          </Text>

          <View style={styles.previewMeta}>
            {parsed.priority !== 'none' && (
              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>
                  {priorityLabels[parsed.priority]}
                </Text>
              </View>
            )}

            {parsed.tags.map((tag) => (
              <View key={tag} style={[styles.previewBadge, styles.tagBadge]}>
                <Text style={[styles.previewBadgeText, styles.tagBadgeText]}>
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#111827',
    writingDirection: 'rtl',
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C7D2FE',
  },
  sendText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  previewContainer: {
    marginTop: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 6,
  },
  previewMeta: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
  },
  previewBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  previewBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  tagBadge: {
    backgroundColor: '#EEF2FF',
  },
  tagBadgeText: {
    color: '#6366F1',
  },
});
