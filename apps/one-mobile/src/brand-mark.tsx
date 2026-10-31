import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { theme } from './theme';

export function BrandMark() {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    let motionChanged = false;
    let animation: Animated.CompositeAnimation | undefined;
    const updateMotion = (reduceMotion: boolean) => {
      animation?.stop();
      rotation.setValue(0);
      if (reduceMotion || !mounted) return;
      animation = Animated.loop(Animated.timing(rotation, {
        toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true,
      }));
      animation.start();
    };
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      motionChanged = true;
      updateMotion(enabled);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted && !motionChanged) updateMotion(enabled);
    }).catch(() => { /* Keep the static mark if the accessibility setting is unavailable. */ });
    return () => {
      mounted = false;
      subscription.remove();
      animation?.stop();
    };
  }, [rotation]);

  return (
    <View accessible accessibilityLabel="B1 BLACK ONE">
      <Animated.View style={{ transform: [{ perspective: 900 }, { rotateY: rotation.interpolate({
        inputRange: [0, 1], outputRange: ['0deg', '360deg'],
      }) }] }}>
        <Text style={styles.mark}>B<Text style={styles.accent}>1</Text></Text>
      </Animated.View>
      <Text style={styles.name}>BLACK ONE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { color: theme.colors.primary, fontSize: 42, lineHeight: 46, fontWeight: '900', fontStyle: 'italic', letterSpacing: -3 },
  accent: { color: theme.colors.accent },
  name: { color: theme.colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 4, marginTop: 4 },
});
