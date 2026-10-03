import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../src/theme';

const items = [
  ['Live Tracking', 'Follow the trip on the map in real time.'],
  ['Ride Code', 'A unique code confirms the correct driver and passenger.'],
  ['Secure Chat', 'Keep trip communication inside ONE.'],
  ['Emergency Support', 'Fast access to support from the active ride.'],
];

export default function SafetyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>ONE SAFETY</Text>
        <Text style={styles.title}>Know your driver.{'
'}Know your ride.</Text>
        <Text style={styles.sub}>Safety is designed into the ride flow, not added as an afterthought.</Text>
        {items.map(([title, body]) => (
          <View key={title} style={styles.card}>
            <View style={styles.dot} />
            <View style={styles.copy}>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardBody}>{body}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 40 },
  kicker: { color: theme.colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: theme.colors.white, fontSize: 36, lineHeight: 38, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 12, marginBottom: 20 },
  card: { flexDirection: 'row', gap: 14, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 16, marginBottom: 12 },
  dot: { width: 11, height: 11, borderRadius: 6, backgroundColor: theme.colors.cyan, marginTop: 5 },
  copy: { flex: 1 },
  cardTitle: { color: theme.colors.white, fontSize: 16, fontWeight: '900' },
  cardBody: { color: theme.colors.muted, lineHeight: 20, marginTop: 5 },
});
