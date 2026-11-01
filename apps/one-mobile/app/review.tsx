import { canCarryPassengers } from '../src/vehicle-capacity';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchQuotePreview, QuotePreview, submitReservationRequest } from '../src/reservation-api';
import { useReservation } from '../src/reservation-context';
import { getMarketLabel, getVehicleLabel, isTripDetailsComplete } from '../src/reservation';
import { theme } from '../src/theme';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function ReviewScreen() {
  const { draft, setReceipt } = useReservation();
  const pending = useRef(false);
  const sent = useRef(false);
  const canSubmit = isTripDetailsComplete(draft) && canCarryPassengers(draft.vehicleClass, draft.passengers);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState<QuotePreview | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setQuote(null);
    if (!canSubmit) { setQuoteLoading(false); return; }
    setQuoteLoading(true);
    fetchQuotePreview(draft, controller.signal).then((next) => {
      if (!active) return;
      setQuote(next);
      setQuoteLoading(false);
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [draft, canSubmit]);

  async function submit() {
    if (pending.current || sent.current || !canSubmit) return;
    pending.current = true;
    setSubmitting(true);
    setError('');
    try {
      const receipt = await submitReservationRequest(draft);
      sent.current = true;
      setReceipt(receipt);
      router.replace('/confirmation');
    } catch (error) {
      if (error instanceof Error && error.message === 'invalid_request') {
        setError('Check trip details, flight number, vehicle capacity and future pickup/return times.');
      } else setError('ONE could not confirm the result. Your request may have been received. Check My Reservations or contact BLACK ONE Support before sending it again. This step does not take payment.');
    } finally {
      pending.current = false;
      if (!sent.current) setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>STEP 3 OF 3</Text>
        <Text style={styles.title}>Review your ride</Text>
        <Text style={styles.sub}>Check the trip details before sending the reservation request to BLACK ONE.</Text>

        <View style={styles.card}>
          <Row label="Market" value={getMarketLabel(draft.marketId)} />
          <Row label="Service" value={draft.rideType.replace('-', ' ')} />
          <Row label="Pickup" value={draft.pickup} />
          {draft.rideType !== 'hourly' ? <Row label="Drop-off" value={draft.dropoff} /> : null}
          <Row label="When" value={draft.pickupDate + ' · ' + draft.pickupTime} />
          {draft.rideType === 'round-trip' ? <Row label="Return" value={draft.returnDate + ' · ' + draft.returnTime} /> : null}
          {draft.rideType === 'hourly' ? <Row label="Hours" value={String(draft.hourlyHours)} /> : null}
          {draft.airportPickup ? <>
            <Row label="Flight / Vuelo" value={draft.flightNumber || 'To be coordinated / A coordinar'} />
            <Row label="Meeting / Encuentro" value={draft.pickupMeeting === 'curbside' ? 'Curbside / Exterior' : 'Meet & greet · requires confirmation'} />
            {draft.pickupInstructions ? <Row label="Instructions" value={draft.pickupInstructions} /> : null}
          </> : null}
          <Row label="Passengers" value={String(draft.passengers)} />
          <Row label="Vehicle" value={getVehicleLabel(draft.vehicleClass)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PASSENGER</Text>
          <Text style={styles.passenger}>{draft.fullName}</Text>
          <Text style={styles.contact}>{draft.email}</Text>
          <Text style={styles.contact}>{draft.phone}</Text>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.priceTitle}>Transparent pricing</Text>
          {quoteLoading ? (
            <Text style={styles.priceText}>Calculating route and fare…</Text>
          ) : quote?.status === 'quoted' && quote.amountMinor != null ? (
            <>
              <Text style={styles.quoteAmount}>
                {new Intl.NumberFormat(undefined, { style: 'currency', currency: quote.currency }).format(quote.amountMinor / 100)}
              </Text>
              {quote.distanceMeters ? (
                <Text style={styles.priceText}>
                  Approx. {(quote.distanceMeters / 1609.344).toFixed(1)} mi
                  {quote.durationSeconds ? ' · ' + Math.round(quote.durationSeconds / 60) + ' min' : ''}
                </Text>
              ) : null}
              <Text style={styles.priceText}>Final availability is confirmed before dispatch.</Text>
            </>
          ) : (
            <Text style={styles.priceText}>
              ONE will confirm route availability, vehicle assignment, tolls and the final price before dispatch.
            </Text>
          )}
        </View>

        {!canSubmit ? <Pressable style={styles.editButton} onPress={() => router.replace('/book')} accessibilityRole="button"><Text style={styles.error}>Complete the required trip and passenger details →</Text></Pressable> : null}
        {error ? <><Text style={styles.error}>{error}</Text><Pressable style={styles.editButton} onPress={() => router.push('/trips')} accessibilityRole="button"><Text style={styles.editText}>CHECK MY RESERVATIONS →</Text></Pressable></> : null}

        <Pressable
          style={[styles.button, submitting || !canSubmit ? styles.buttonDisabled : null]}
          disabled={submitting || !canSubmit}
          onPress={submit}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{submitting ? 'SENDING…' : 'REQUEST RESERVATION →'}</Text>
        </Pressable>

        <Pressable style={styles.editButton} onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.editText}>← Edit vehicle</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 44 },
  kicker: { color: theme.colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: theme.colors.text, fontSize: 34, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 22 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 17, marginBottom: 13 },
  row: { flexDirection: 'row', gap: 18, justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  rowLabel: { color: theme.colors.muted, fontSize: 12, fontWeight: '700' },
  rowValue: { color: theme.colors.text, flex: 1, textAlign: 'right', fontSize: 13, fontWeight: '800', textTransform: 'capitalize' },
  sectionLabel: { color: theme.colors.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  passenger: { color: theme.colors.text, fontWeight: '900', fontSize: 18, marginTop: 9 },
  contact: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
  priceCard: { backgroundColor: theme.colors.selected, borderWidth: 1, borderColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 16, marginBottom: 14 },
  priceTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 15 },
  quoteAmount: { color: theme.colors.text, fontSize: 28, fontWeight: '900', marginTop: 8 },
  priceText: { color: theme.colors.cyanSoft, lineHeight: 19, marginTop: 6, fontSize: 12 },
  error: { color: theme.colors.danger, marginBottom: 12, fontWeight: '700' },
  button: { backgroundColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 17, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: theme.colors.onAccent, fontWeight: '900' },
  editButton: { alignItems: 'center', padding: 15 },
  editText: { color: theme.colors.muted, fontWeight: '800' },
});
