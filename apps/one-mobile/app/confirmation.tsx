import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createCheckoutUrl } from '../src/reservation-api';
import { useReservation } from '../src/reservation-context';
import { theme } from '../src/theme';

export default function ConfirmationScreen() {
  const { draft, receipt, resetDraft } = useReservation();
  const [paying, setPaying] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const canPay = receipt?.quoteStatus === 'quoted' && (receipt.amountMinor ?? 0) > 0;

  async function payNow() {
    if (!receipt?.requestCode || paying) return;
    setPaying(true);
    setPaymentMessage('');
    try {
      const url = await createCheckoutUrl(receipt.requestCode, draft.email);
      await Linking.openURL(url);
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setPaymentMessage(
        code === 'already_paid'
          ? 'This reservation is already paid.'
          : code === 'quote_not_confirmed'
            ? 'The final ONE quote must be confirmed before payment.'
            : 'Secure payment is temporarily unavailable. Your reservation request remains saved.',
      );
    } finally {
      setPaying(false);
    }
  }

  function finish() {
    resetDraft();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>✓</Text>
        </View>
        <Text style={styles.kicker}>ONE RESERVATIONS</Text>
        <Text style={styles.title}>Request received.</Text>
        <Text style={styles.body}>
          BLACK ONE received your reservation in the ONE system. Keep the request code and ride code for this trip.
        </Text>

        {receipt ? (
          <View style={styles.referenceCard}>
            <Text style={styles.referenceLabel}>REQUEST CODE</Text>
            <Text style={styles.referenceCode}>{receipt.requestCode}</Text>
            <Text style={styles.referenceHelp}>Use this code for reservation support and tracking.</Text>

            {receipt.rideCode ? (
              <View style={styles.rideCodeBox}>
                <Text style={styles.rideCodeLabel}>ONE RIDE CODE</Text>
                <Text style={styles.rideCode}>{receipt.rideCode}</Text>
                <Text style={styles.rideCodeHelp}>
                  Give this code only to your assigned driver after the driver arrives.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What happens next</Text>
          <Text style={styles.item}>1. ONE confirms the selected market, route and vehicle availability.</Text>
          <Text style={styles.item}>2. Complete secure payment when a calculated quote is available.</Text>
          <Text style={styles.item}>3. BLACK ONE assigns a verified compatible driver and vehicle.</Text>
          <Text style={styles.item}>4. Track the trip, chat securely and verify the ride code at pickup.</Text>
        </View>

        {canPay ? (
          <Pressable style={styles.payButton} onPress={payNow} disabled={paying} accessibilityRole="button">
            <Text style={styles.payButtonText}>
              {paying
                ? 'OPENING SECURE PAYMENT…'
                : 'PAY SECURELY · ' +
                  new Intl.NumberFormat(undefined, {
                    style: 'currency',
                    currency: receipt?.currency ?? 'USD',
                  }).format((receipt?.amountMinor ?? 0) / 100)}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.manualCard}>
            <Text style={styles.manualTitle}>QUOTE CONFIRMATION</Text>
            <Text style={styles.manualText}>
              Payment opens only after ONE has a confirmed fare. No payment is taken on this screen.
            </Text>
          </View>
        )}

        {paymentMessage ? <Text style={styles.paymentMessage}>{paymentMessage}</Text> : null}

        <Pressable
          style={styles.trackButton}
          onPress={() => router.push('/trips')}
          accessibilityRole="button"
        >
          <Text style={styles.trackButtonText}>MY RESERVATIONS →</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={finish} accessibilityRole="button">
          <Text style={styles.buttonText}>BACK TO ONE</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, paddingBottom: 44 },
  icon: { width: 70, height: 70, borderRadius: 35, backgroundColor: theme.colors.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconText: { color: '#16100A', fontSize: 34, fontWeight: '900' },
  kicker: { color: theme.colors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: theme.colors.white, fontSize: 36, fontWeight: '900', marginTop: 8 },
  body: { color: theme.colors.muted, fontSize: 15, lineHeight: 23, marginTop: 13 },
  referenceCard: { backgroundColor: '#171108', borderWidth: 1, borderColor: theme.colors.gold, borderRadius: theme.radius.lg, padding: 18, marginTop: 24 },
  referenceLabel: { color: theme.colors.goldSoft, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  referenceCode: { color: theme.colors.white, fontSize: 23, fontWeight: '900', marginTop: 6, letterSpacing: 1 },
  referenceHelp: { color: theme.colors.muted, fontSize: 12, marginTop: 6 },
  rideCodeBox: { borderTopWidth: 1, borderTopColor: '#4A3A20', marginTop: 16, paddingTop: 14 },
  rideCodeLabel: { color: theme.colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  rideCode: { color: theme.colors.goldSoft, fontSize: 31, fontWeight: '900', letterSpacing: 5, marginTop: 5 },
  rideCodeHelp: { color: theme.colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 18, marginTop: 14 },
  cardTitle: { color: theme.colors.white, fontSize: 16, fontWeight: '900', marginBottom: 8 },
  item: { color: theme.colors.muted, fontSize: 13, lineHeight: 21, marginTop: 5 },
  payButton: { backgroundColor: theme.colors.gold, borderRadius: theme.radius.md, padding: 17, alignItems: 'center', marginTop: 20 },
  payButtonText: { color: '#16100A', fontWeight: '900', textAlign: 'center' },
  manualCard: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, marginTop: 16 },
  manualTitle: { color: theme.colors.goldSoft, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  manualText: { color: theme.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  paymentMessage: { color: theme.colors.goldSoft, textAlign: 'center', lineHeight: 18, marginTop: 12 },
  trackButton: { borderWidth: 1, borderColor: theme.colors.gold, borderRadius: theme.radius.md, padding: 15, alignItems: 'center', marginTop: 12 },
  trackButtonText: { color: theme.colors.goldSoft, fontWeight: '900' },
  button: { backgroundColor: theme.colors.surfaceRaised, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 15, alignItems: 'center', marginTop: 10 },
  buttonText: { color: theme.colors.white, fontWeight: '900' },
});
