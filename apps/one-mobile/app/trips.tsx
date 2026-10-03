import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSessionToken } from '../src/auth-client';
import { theme } from '../src/theme';

type Trip = {
  request_code: string;
  market_id: string;
  ride_type: string;
  pickup_text: string;
  dropoff_text?: string | null;
  pickup_date_text: string;
  pickup_time_text: string;
  passenger_count: number;
  vehicle_class_id: string;
  status: string;
  payment_status: string;
  quote_amount_minor?: number | null;
  quote_currency?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_year?: number | null;
  vehicle_color?: string | null;
  plate_number?: string | null;
};

export default function TripsScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function load() {
    const base = process.env.EXPO_PUBLIC_ONE_API_URL?.trim().replace(/\/$/, '');
    const token = await getSessionToken();
    if (!base || !token) {
      setMessage('Sign in to My ONE to see synchronized reservations.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(base + '/one/api/my-reservations', {
        headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      });
      if (!response.ok) {
        setMessage('ONE could not load your reservations.');
        return;
      }
      const data = (await response.json()) as { trips?: Trip[] };
      setTrips(data.trips ?? []);
    } catch {
      setMessage('ONE could not reach the reservation service.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>MY ONE</Text>
        <Text style={styles.title}>My reservations</Text>
        <Text style={styles.sub}>Reservations made while signed in are synchronized with your ONE account.</Text>

        {loading ? <Text style={styles.message}>Loading reservations…</Text> : null}
        {!loading && trips.length === 0 && !message ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No reservations yet.</Text>
            <Text style={styles.emptyText}>Your future ONE reservations will appear here.</Text>
          </View>
        ) : null}

        {trips.map((trip) => (
          <View key={trip.request_code} style={styles.card}>
            <View style={styles.top}>
              <Text style={styles.code}>{trip.request_code}</Text>
              <Text style={styles.status}>{trip.status.replaceAll('_', ' ').toUpperCase()}</Text>
            </View>
            <Text style={styles.route}>{trip.pickup_text}</Text>
            {trip.dropoff_text ? <Text style={styles.route}>→ {trip.dropoff_text}</Text> : null}
            <Text style={styles.meta}>{trip.pickup_date_text} · {trip.pickup_time_text}</Text>
            <Text style={styles.meta}>{trip.vehicle_class_id.toUpperCase()} · {trip.passenger_count} passenger(s)</Text>
            <Text style={styles.payment}>Payment: {trip.payment_status.replaceAll('_', ' ')}</Text>
            {trip.quote_amount_minor && trip.quote_currency ? (
              <Text style={styles.amount}>
                {new Intl.NumberFormat(undefined, { style: 'currency', currency: trip.quote_currency }).format(Number(trip.quote_amount_minor) / 100)}
              </Text>
            ) : null}
            {trip.driver_name ? (
              <View style={styles.driverCard}>
                <Text style={styles.driverLabel}>DRIVER ASSIGNED</Text>
                <Text style={styles.driverName}>{trip.driver_name}</Text>
                <Text style={styles.driverMeta}>
                  {[trip.vehicle_year, trip.vehicle_make, trip.vehicle_model].filter(Boolean).join(' ')}
                </Text>
                {trip.plate_number ? <Text style={styles.driverMeta}>Plate · {trip.plate_number}</Text> : null}
              </View>
            ) : null}
          </View>
        ))}

        <Pressable style={styles.refresh} onPress={load}>
          <Text style={styles.refreshText}>REFRESH</Text>
        </Pressable>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 44 },
  kicker: { color: theme.colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: theme.colors.white, fontSize: 34, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.muted, lineHeight: 21, marginTop: 10, marginBottom: 20 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 17, marginBottom: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  code: { color: theme.colors.cyanSoft, fontWeight: '900' },
  status: { color: theme.colors.cyan, fontWeight: '900', fontSize: 10, maxWidth: 140, textAlign: 'right' },
  route: { color: theme.colors.white, fontWeight: '800', marginTop: 9 },
  meta: { color: theme.colors.muted, marginTop: 5, fontSize: 12 },
  payment: { color: theme.colors.cyanSoft, fontWeight: '800', marginTop: 12, textTransform: 'capitalize' },
  amount: { color: theme.colors.white, fontWeight: '900', fontSize: 22, marginTop: 5 },
  driverCard: { backgroundColor: theme.colors.surfaceRaised, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginTop: 14 },
  driverLabel: { color: theme.colors.cyan, fontWeight: '900', fontSize: 10, letterSpacing: 1.2 },
  driverName: { color: theme.colors.white, fontWeight: '900', fontSize: 16, marginTop: 5 },
  driverMeta: { color: theme.colors.muted, fontSize: 12, marginTop: 3 },
  empty: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 18 },
  emptyTitle: { color: theme.colors.white, fontWeight: '900', fontSize: 17 },
  emptyText: { color: theme.colors.muted, marginTop: 6 },
  refresh: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, alignItems: 'center', marginTop: 10 },
  refreshText: { color: theme.colors.white, fontWeight: '900' },
  message: { color: theme.colors.muted, textAlign: 'center', marginTop: 14 },
});
