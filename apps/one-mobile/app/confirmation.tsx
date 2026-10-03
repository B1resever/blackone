import { router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createCheckoutUrl } from '../src/reservation-api';
import { useReservation } from '../src/reservation-context';
import { theme } from '../src/theme';

export default function ConfirmationScreen() {
  const { receipt, resetDraft } = useReservation();
  const canPay = receipt?.quoteStatus === 'quoted' && (receipt.amountMinor ?? 0) > 0;

  async function payNow() {
    if (!receipt?.requestCode) return;
    const url = await createCheckoutUrl(receipt.requestCode);
    if (url) await Linking.openURL(url);
  }

  function finish() {
    resetDraft();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>✓</Text>
        </View>
        <Text style={styles.kicker}>ONE RESERVATIONS</Text>
        <Text style={styles.title}>Request received.</Text>
        <Text style={styles.body}>
          BLACK ONE received your reservation request. The ride is not dispatched until availability and final pricing are confirmed.
        </Text>

        {receipt ? (
          <View style={styles.referenceCard}>
            <Text style={styles.referenceLabel}>REQUEST CODE</Text>
            <Text style={styles.referenceCode}>{receipt.requestCode}</Text>
            <Text style={styles.referenceHelp}>Keep this code for reservation support.</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What happens next</Text>
          <Text style={styles.item}>1. ONE reviews route and vehicle availability.</Text>
          <Text style={styles.item}>2. Final pricing and any tolls are confirmed.</Text>
          <Text style={styles.item}>3. You receive confirmation before dispatch.</Text>
        </View>

        {canPay ? (
          <Pressable style={styles.payButton} onPress={payNow} accessibilityRole="button">
            <Text style={styles.payButtonText}>
              PAY SECURELY · {new Intl.NumberFormat(undefined, { style: 'currency', currency: receipt?.currency ?? 'USD' }).format((receipt?.amountMinor ?? 0) / 100)}
            </Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.button} onPress={finish} accessibilityRole="button">
          <Text style={styles.buttonText}>BACK TO ONE</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  icon: { width: 70, height: 70, borderRadius: 35, backgroundColor: theme.colors.cyan, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconText: { color: '#001217', fontSize: 34, fontWeight: '900' },
  kicker: { color: theme.colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: theme.colors.white, fontSize: 36, fontWeight: '900', marginTop: 8 },
  body: { color: theme.colors.muted, fontSize: 15, lineHeight: 23, marginTop: 13 },
  referenceCard: { backgroundColor: '#04202A', borderWidth: 1, borderColor: theme.colors.cyan, borderRadius: theme.radius.lg, padding: 18, marginTop: 24 },
  referenceLabel: { color: theme.colors.cyanSoft, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  referenceCode: { color: theme.colors.white, fontSize: 25, fontWeight: '900', marginTop: 6, letterSpacing: 1 },
  referenceHelp: { color: theme.colors.muted, fontSize: 12, marginTop: 6 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 18, marginTop: 14 },
  cardTitle: { color: theme.colors.white, fontSize: 16, fontWeight: '900', marginBottom: 8 },
  item: { color: theme.colors.muted, fontSize: 13, lineHeight: 21, marginTop: 5 },
  payButton: { backgroundColor: theme.colors.white, borderRadius: theme.radius.md, padding: 17, alignItems: 'center', marginTop: 20 },
  payButtonText: { color: '#001217', fontWeight: '900', textAlign: 'center' },
  button: { backgroundColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 17, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#001217', fontWeight: '900' },
});
