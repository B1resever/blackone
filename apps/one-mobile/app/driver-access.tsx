import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  activateDriverAccount,
  DriverTrip,
  loadDriverTrips,
  updateDriverTrip,
} from '../src/auth-client';
import { useAuth } from '../src/auth-context';
import { theme } from '../src/theme';

type DriverStatus = 'driver_en_route' | 'arrived' | 'passenger_onboard' | 'completed';

const nextStatus: Record<string, { status: DriverStatus; label: string } | null> = {
  assigned: { status: 'driver_en_route', label: 'START TRIP · EN ROUTE' },
  confirmed: { status: 'driver_en_route', label: 'START TRIP · EN ROUTE' },
  driver_en_route: { status: 'arrived', label: 'MARK ARRIVED' },
  arrived: { status: 'passenger_onboard', label: 'PASSENGER ONBOARD' },
  passenger_onboard: { status: 'completed', label: 'COMPLETE TRIP' },
  completed: null,
};

export default function DriverAccessScreen() {
  const { user, refresh, logout } = useAuth();
  const [applicationCode, setApplicationCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  async function refreshTrips() {
    if (user?.role !== 'driver') return;
    setLoadingTrips(true);
    try {
      setTrips(await loadDriverTrips());
    } catch {
      setMessage('ONE could not load assigned trips.');
    } finally {
      setLoadingTrips(false);
    }
  }

  useEffect(() => {
    void refreshTrips();
  }, [user?.id, user?.role]);

  async function activate() {
    if (working) return;
    setWorking(true);
    setMessage('');
    try {
      await activateDriverAccount(applicationCode.trim(), email.trim(), password);
      await refresh();
      setPassword('');
      setMessage('Driver account activated.');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setMessage(
        code === 'driver_not_approved'
          ? 'This driver application has not been approved yet.'
          : 'ONE could not activate this driver account.',
      );
    } finally {
      setWorking(false);
    }
  }

  async function moveTrip(trip: DriverTrip, status: DriverStatus) {
    setWorking(true);
    setMessage('');
    try {
      await updateDriverTrip(trip.request_code, status);
      await refreshTrips();
    } catch {
      setMessage('Trip status could not be updated.');
    } finally {
      setWorking(false);
    }
  }

  if (user?.role === 'driver') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>ONE DRIVER</Text>
          <Text style={styles.title}>Your assigned trips.</Text>
          <Text style={styles.sub}>Only trips assigned to your approved driver account appear here.</Text>

          <View style={styles.profile}>
            <Text style={styles.profileName}>{user.fullName}</Text>
            <Text style={styles.profileMeta}>{user.email}</Text>
          </View>

          {loadingTrips ? <Text style={styles.message}>Loading trips…</Text> : null}
          {!loadingTrips && trips.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No assigned trips.</Text>
              <Text style={styles.emptyText}>New assigned reservations will appear here automatically.</Text>
            </View>
          ) : null}

          {trips.map((trip) => {
            const action = nextStatus[trip.status] ?? null;
            return (
              <View key={trip.request_code} style={styles.trip}>
                <View style={styles.tripTop}>
                  <Text style={styles.code}>{trip.request_code}</Text>
                  <Text style={styles.status}>{trip.status.replaceAll('_', ' ').toUpperCase()}</Text>
                </View>
                <Text style={styles.route}>{trip.pickup_text}</Text>
                {trip.dropoff_text ? <Text style={styles.route}>→ {trip.dropoff_text}</Text> : null}
                <Text style={styles.meta}>{trip.pickup_date_text} · {trip.pickup_time_text}</Text>
                <Text style={styles.meta}>{trip.vehicle_class_id.toUpperCase()} · {trip.passenger_count} passenger(s)</Text>
                {trip.guest_full_name ? <Text style={styles.passenger}>{trip.guest_full_name}</Text> : null}
                {trip.guest_phone ? <Text style={styles.meta}>{trip.guest_phone}</Text> : null}
                {action ? (
                  <Pressable style={styles.primary} disabled={working} onPress={() => moveTrip(trip, action.status)}>
                    <Text style={styles.primaryText}>{working ? 'UPDATING…' : action.label}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}

          <Pressable style={styles.secondary} onPress={refreshTrips}>
            <Text style={styles.secondaryText}>REFRESH TRIPS</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={logout}>
            <Text style={styles.secondaryText}>SIGN OUT DRIVER</Text>
          </Pressable>

          {message ? <Text style={styles.message}>{message}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>ONE DRIVER ACCESS</Text>
        <Text style={styles.title}>Activate approved driver access.</Text>
        <Text style={styles.sub}>
          After BLACK ONE approves your driver application, use the application code and email to create your driver password.
        </Text>

        <Text style={styles.label}>Approved application code</Text>
        <TextInput style={styles.input} value={applicationCode} onChangeText={setApplicationCode} placeholder="DRV-..." placeholderTextColor={theme.colors.muted} autoCapitalize="characters" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="name@email.com" placeholderTextColor={theme.colors.muted} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>Create driver password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="At least 10 characters" placeholderTextColor={theme.colors.muted} secureTextEntry />

        <Pressable
          style={[styles.primary, applicationCode.length < 8 || !email.includes('@') || password.length < 10 ? styles.disabled : null]}
          disabled={applicationCode.length < 8 || !email.includes('@') || password.length < 10 || working}
          onPress={activate}
        >
          <Text style={styles.primaryText}>{working ? 'ACTIVATING…' : 'ACTIVATE DRIVER ACCOUNT →'}</Text>
        </Pressable>

        <Text style={styles.message}>
          If the driver account is already activated, sign in through My ONE using the same email and password.
        </Text>
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
  label: { color: theme.colors.white, fontSize: 12, fontWeight: '800', marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.md, color: theme.colors.white, paddingHorizontal: 16, paddingVertical: 15 },
  primary: { backgroundColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 15, alignItems: 'center', marginTop: 16 },
  primaryText: { color: '#001217', fontWeight: '900', textAlign: 'center' },
  disabled: { opacity: 0.35 },
  secondary: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, alignItems: 'center', marginTop: 10 },
  secondaryText: { color: theme.colors.white, fontWeight: '900' },
  message: { color: theme.colors.muted, lineHeight: 19, textAlign: 'center', marginTop: 14 },
  profile: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 15, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16 },
  profileName: { color: theme.colors.white, fontWeight: '900', fontSize: 18 },
  profileMeta: { color: theme.colors.muted, marginTop: 4 },
  empty: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 20, borderWidth: 1, borderColor: theme.colors.border },
  emptyTitle: { color: theme.colors.white, fontWeight: '900', fontSize: 17 },
  emptyText: { color: theme.colors.muted, marginTop: 6 },
  trip: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 17, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12 },
  tripTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  code: { color: theme.colors.cyanSoft, fontWeight: '900' },
  status: { color: theme.colors.cyan, fontWeight: '900', fontSize: 10, maxWidth: 140, textAlign: 'right' },
  route: { color: theme.colors.white, fontWeight: '800', marginTop: 10 },
  meta: { color: theme.colors.muted, marginTop: 5, fontSize: 12 },
  passenger: { color: theme.colors.white, fontWeight: '900', marginTop: 12 },
});
