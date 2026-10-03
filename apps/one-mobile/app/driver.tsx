import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../src/theme';

export default function DriverScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>DRIVE WITH ONE</Text>
        <Text style={styles.title}>Drive more.{'
'}Keep more.</Text>
        <Text style={styles.sub}>A simple driver model with transparent platform fees and premium scheduled rides.</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>USA DRIVER MODEL</Text>
          <Text style={styles.price}>$25<Text style={styles.priceSmall}> / month</Text></Text>
          <Text style={styles.cardText}>Or 5% per trip until the monthly $25 is reached. After that, $0 platform fee for the rest of the month.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>ARGENTINA LAUNCH</Text>
          <Text style={styles.big}>First month free.</Text>
          <Text style={styles.price}>10%<Text style={styles.priceSmall}> per trip</Text></Text>
          <Text style={styles.cardText}>Scheduled reservations first, expanding area by area.</Text>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Driver onboarding</Text>
          <Text style={styles.noticeText}>Identity, license, vehicle, insurance, background verification and payout setup will live here before activation.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 40 },
  kicker: { color: theme.colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: theme.colors.white, fontSize: 40, lineHeight: 42, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 12, marginBottom: 22 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 20, marginBottom: 14 },
  cardLabel: { color: theme.colors.cyan, fontSize: 11, fontWeight: '900', letterSpacing: 1.8 },
  price: { color: theme.colors.white, fontSize: 34, fontWeight: '900', marginTop: 10 },
  priceSmall: { color: theme.colors.muted, fontSize: 14, fontWeight: '700' },
  big: { color: theme.colors.white, fontSize: 21, fontWeight: '900', marginTop: 12 },
  cardText: { color: theme.colors.muted, lineHeight: 20, marginTop: 8 },
  notice: { borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceRaised, padding: 18, marginTop: 8 },
  noticeTitle: { color: theme.colors.white, fontSize: 16, fontWeight: '900' },
  noticeText: { color: theme.colors.muted, lineHeight: 20, marginTop: 8 },
});
