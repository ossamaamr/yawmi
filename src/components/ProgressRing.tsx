import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
}

const DEFAULT_COLOR = '#6366F1';
const DEFAULT_BG_COLOR = '#E5E7EB';

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  color = DEFAULT_COLOR,
  bgColor = DEFAULT_BG_COLOR,
}: ProgressRingProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(clampedProgress, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [clampedProgress]);

  const percentage = Math.round(clampedProgress * 100);

  const animatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(animatedProgress.value, [0, 1], [0, 360]);
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: percentage,
      }}
    >
      <View
        style={[
          styles.backgroundRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: bgColor,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.progressRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: bgColor,
            borderRightColor: bgColor,
          },
          animatedStyle,
        ]}
      />

      <View style={styles.labelContainer}>
        <Text style={[styles.label, { fontSize: size * 0.22 }]}>
          %{percentage}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundRing: {
    position: 'absolute',
  },
  progressRing: {
    position: 'absolute',
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
});
