import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../src/theme';

type ReservationStatus = {
  request_code: string;
  market_id: string;
  ride_type: string;
  pickup_text: string;
  dropoff_text?: string | null;
  pickup_date_text: string;
  pickup_time_text: string;
  vehicle_class_id: string;
  passenger_count: number;
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

export default function ReservationStatusScreen() {
  const [requestCode, setRequestCode] = useState('');
  const [email, setEmail] = useState('');
  const [reservation, setReservation] = useState<ReservationStatus | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function cancelReservation() {
    if (!reservation || cancelling) return;
    const apiBaseUrl = process.env.EXPO_PUBLIC_ONE_API_URL?.trim().replace(/\/$/, '');
    if (!apiBaseUrl) {
      setMessage('Cancellation is unavailable until ONE API is connected.');
      return;
    }

    setCancelling(true);
    setMessage('');
    try {
      const response = await fetch(apiBaseUrl + '/one/api/cancel-reservation', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestCode: reservation.request_code, email, reason: '' }),
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(data.message ?? 'This reservation cannot be cancelled in the app.');
        return;
      }

      setMessage(data.message ?? 'Cancellation recorded.');
      setReservation((current) => current ? { ...current, status: 'cancelled' } : current);
    } catch {
      setMessage('ONE could not reach the cancellation service.');
    } finally {
      setCancelling(false);
    }
  }

  async function findReservation() {
    const apiBaseUrl = process.env.EXPO_PUBLIC_ONE_API_URL?.trim().replace(/\/$/, '');
    if (!apiBaseUrl) {
      setMessage('Reservation tracking will be available when ONE API is connected.');
      return;
    }

    setLoading(true);
    setMessage('');
    setReservation(null);

    try {
      const response = await fetch(apiBaseUrl + '/one/api/reservation-status', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestCode, email }),
      });

      if (!response.ok) {
        setMessage('Reservation not found. Check the request code and email.');
        return;
      }

      const data = (await response.json()) as { reservation: ReservationStatus };
      setReservation(data.reservation);
    } catch {
      setMessage('ONE could not reach the reservation service.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>MY ONE</Text>
        <Text style={styles.title}>Track a reservation</Text>
        <Text style={styles.sub}>Use the request code shown after booking and the passenger email.</Text>

        <Text style={styles.label}>Request code</Text>
        <TextInput
          value={requestCode}
          onChangeText={setRequestCode}
          placeholder="ONE-..."
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="characters"
          style={styles.input}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="name@email.com"
          placeholderTextColor={theme.colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Pressable style={styles.button} onPress={findReservation} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'CHECKING…' : 'FIND RESERVATION →'}</Text>
        </Pressable>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {reservation ? (
          <View style={styles.card}>
            <Text style={styles.code}>{reservation.request_code}</Text>
            <Text style={styles.status}>{reservation.status.toUpperCase()}</Text>
            <Text style={styles.route}>{reservation.pickup_text}</Text>
            {reservation.dropoff_text ? <Text style={styles.route}>→ {reservation.dropoff_text}</Text> : null}
            <Text style={styles.meta}>{reservation.pickup_date_text} · {reservation.pickup_time_text}</Text>
            <Text style={styles.meta}>{reservation.vehicle_class_id.toUpperCase()} · {reservation.passenger_count} passenger(s)</Text>
            <Text style={styles.payment}>Payment: {reservation.payment_status.replaceAll('_', ' ')}</Text>
            {reservation.quote_amount_minor && reservation.quote_currency ? (
              <Text style={styles.amount}>
                {new Intl.NumberFormat(undefined, { style: 'currency', currency: reservation.quote_currency }).format(Number(reservation.quote_amount_minor) / 100)}
              </Text>
            ) : null}

            {reservation.driver_name ? (
              <View style={styles.driverCard}>
                <Text style={styles.driverLabel}>YOUR DRIVER</Text>
                <Text style={styles.driverName}>{reservation.driver_name}</Text>
                {reservation.vehicle_make || reservation.vehicle_model ? (
                  <Text style={styles.driverMeta}>
                    {[reservation.vehicle_year, reservation.vehicle_make, reservation.vehicle_model].filter(Boolean).join(' ')}
                  </Text>
                ) : null}
                {reservation.vehicle_color || reservation.plate_number ? (
                  <Text style={styles.driverMeta}>
                    {[reservation.vehicle_color, reservation.plate_number].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
              </View>
            ) : null}

            {!['completed', 'cancelled'].includes(reservation.status) ? (
              <Pressable style={styles.cancelButton} onPress={cancelReservation} disabled={cancelling}>
                <Text style={styles.cancelText}>{cancelling ? 'CANCELLING…' : 'CANCEL RESERVATION'}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
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
  label: { color: theme.colors.white, fontSize: 12, fontWeight: '800', marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.md, color: theme.colors.white, paddingHorizontal: 16, paddingVertical: 15, fontSize: 15 },
  button: { backgroundColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 17, marginTop: 20, alignItems: 'center' },
  buttonText: { color: '#001217', fontWeight: '900' },
  message: { color: theme.colors.muted, textAlign: 'center', marginTop: 16 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 18, marginTop: 24 },
  code: { color: theme.colors.cyanSoft, fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  status: { color: theme.colors.white, fontSize: 24, fontWeight: '900', marginTop: 8 },
  route: { color: theme.colors.white, fontSize: 14, fontWeight: '700', marginTop: 10 },
  meta: { color: theme.colors.muted, marginTop: 6, fontSize: 12 },
  payment: { color: theme.colors.cyanSoft, marginTop: 15, fontWeight: '800', textTransform: 'capitalize' },
  amount: { color: theme.colors.white, fontSize: 26, fontWeight: '900', marginTop: 5 },
  driverCard: { backgroundColor: theme.colors.surfaceRaised, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, marginTop: 16 },
  driverLabel: { color: theme.colors.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  driverName: { color: theme.colors.white, fontSize: 17, fontWeight: '900', marginTop: 6 },
  driverMeta: { color: theme.colors.muted, marginTop: 4, fontSize: 12 },
  cancelButton: { borderWidth: 1, borderColor: theme.colors.danger, borderRadius: theme.radius.md, padding: 14, marginTop: 18, alignItems: 'center' },
  cancelText: { color: theme.colors.danger, fontWeight: '900' },
});
