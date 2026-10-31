import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadTripLocation, type TripLocation } from '../src/auth-client';
import { useAuth } from '../src/auth-context';
import TripMap from '../src/trip-map';
import { isTripLocationFresh, normalizeTripLocation } from '../src/trip-location-state';

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}
const activeStatuses = ['assigned', 'driver_en_route', 'arrived', 'passenger_onboard'];
const terminalStatuses = ['completed', 'cancelled', 'refunded'];

export default function LiveTripScreen() {
  const params = useLocalSearchParams<{ requestCode?: string; marketId?: string }>();
  const requestCode = readParam(params.requestCode);
  const marketId = readParam(params.marketId);
  const { user } = useAuth();
  const [location, setLocation] = useState<TripLocation | null>(null);
  const [tripStatus, setTripStatus] = useState('');
  const [message, setMessage] = useState('Connecting to your trip…');
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    let controller: AbortController | undefined;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setLocation(null);
    setTripStatus('');
    setConnected(false);
    if (!requestCode || !user) {
      setMessage(!requestCode ? 'Choose a reservation to follow your driver.' : 'Sign in to the ONE account attached to this trip.');
      return;
    }
    setMessage('Connecting to your trip…');
    async function poll() {
      let continuePolling = true;
      const requestController = new AbortController();
      controller = requestController;
      const timeout = setTimeout(() => requestController.abort(), 12_000);
      try {
        const data = await loadTripLocation(requestCode, requestController.signal);
        if (stopped) return;
        const nextLocation = normalizeTripLocation(data.location);
        setLocation(nextLocation);
        setTripStatus(data.status);
        setConnected(true);
        const ended = terminalStatuses.includes(data.status);
        continuePolling = !ended;
        setMessage(ended ? 'This trip has ended. The map shows the last reported position.'
          : !nextLocation ? 'Waiting for your driver to share their location.'
          : !isTripLocationFresh(nextLocation) ? 'No recent GPS update. This is the last reported position.' : '');
      } catch (error) {
        if (stopped) return;
        setConnected(false);
        const code = error instanceof Error ? error.message : '';
        if (code === 'trip_location_access_denied' || code === 'trip_not_found') {
          setLocation(null);
          continuePolling = false;
          setMessage(code === 'trip_not_found' ? 'This reservation is not available to your account.' : 'Sign in to the ONE account attached to this trip.');
        } else {
          setMessage('Connection interrupted. Any position shown is the last received, not a live update. Reconnecting…');
        }
      }
      finally { clearTimeout(timeout); }
      if (!stopped && continuePolling) timer = setTimeout(() => void poll(), 5000);
    }
    void poll();
    return () => { stopped = true; controller?.abort(); clearTimeout(timer); };
  }, [requestCode, user?.id]);

  const fresh = Boolean(location && connected && activeStatuses.includes(tripStatus) && isTripLocationFresh(location, now));

  async function openMap() {
    if (!location) return;
    try {
      await Linking.openURL('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(location.latitude + ',' + location.longitude));
    } catch {
      setMessage('The map app could not open. Your driver coordinates remain available below.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>B1 ONE · TRIP TRACKING</Text>
        <Text style={styles.title}>Your driver. Your journey.</Text>
        <Text style={styles.sub}>{requestCode || 'Select a reservation to begin.'}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, !fresh && styles.dotInactive]} />
          <Text style={styles.statusText}>{fresh ? 'RECENT DRIVER LOCATION' : location ? 'LAST REPORTED POSITION' : 'WAITING FOR LOCATION'}</Text>
        </View>
        {location ? <TripMap key={requestCode} location={location} fresh={fresh} /> : (
          <View style={styles.waiting}>
            <Text style={styles.waitingTitle}>Your driver will appear here.</Text>
            <Text style={styles.message}>We show a position only after receiving GPS coordinates from the driver. No simulated route or vehicle is displayed.</Text>
          </View>
        )}
        {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
        <View style={styles.card}>
          <Text style={styles.label}>TRIP STATUS</Text>
          <Text style={styles.value}>{tripStatus ? tripStatus.replaceAll('_', ' ').toUpperCase() : 'NOT CONNECTED'}</Text>
          {location ? (
            <>
              <Text style={styles.label}>DRIVER COORDINATES</Text>
              <Text style={styles.coords}>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</Text>
              <Text style={styles.meta}>
                Received {new Date(location.created_at).toLocaleTimeString()}
                {typeof location.accuracy_meters === 'number' && location.accuracy_meters > 0 ? ' · ±' + Math.round(location.accuracy_meters) + ' m accuracy' : ''}
              </Text>
              <Pressable style={styles.primary} onPress={openMap} accessibilityRole="button">
                <Text style={styles.primaryText}>OPEN {fresh ? 'DRIVER' : 'LAST KNOWN'} POSITION ON MAP →</Text>
              </Pressable>
            </>
          ) : <Pressable style={styles.primary} onPress={() => router.push('/trips')} accessibilityRole="button"><Text style={styles.primaryText}>MY RESERVATIONS →</Text></Pressable>}
        </View>
        {requestCode ? <View style={styles.actions}>
          <Pressable style={styles.secondary} onPress={() => router.push({ pathname: '/chat', params: { requestCode } })} accessibilityRole="button"><Text style={styles.secondaryText}>SECURE CHAT</Text></Pressable>
          <Pressable style={styles.secondary} onPress={() => router.push({ pathname: '/trip-support', params: { requestCode, marketId } })} accessibilityRole="button"><Text style={styles.secondaryText}>SUPPORT / SOS</Text></Pressable>
        </View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 18, paddingBottom: 32, gap: 12 },
  kicker: { color: '#005BEA', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: '#122536', fontSize: 30, fontWeight: '900' },
  sub: { color: '#526473', fontWeight: '700' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#005BEA' },
  dotInactive: { backgroundColor: '#788591' },
  statusText: { color: '#526473', fontSize: 10, fontWeight: '800' },
  waiting: { padding: 22, backgroundColor: '#F3F8FC', borderRadius: 18, gap: 10 },
  waitingTitle: { fontSize: 19, color: '#122536', fontWeight: '800' },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCE3E8', borderRadius: 18, padding: 16, gap: 8 },
  label: { color: '#526473', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  value: { color: '#122536', fontWeight: '900', fontSize: 18, marginBottom: 6 },
  coords: { color: '#122536', fontWeight: '800' },
  meta: { color: '#526473', fontSize: 12 },
  message: { color: '#526473', lineHeight: 21 },
  primary: { backgroundColor: '#005BEA', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 6 },
  primaryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 11 },
  actions: { flexDirection: 'row', gap: 10 },
  secondary: { flex: 1, borderWidth: 1, borderColor: '#DCE3E8', borderRadius: 12, padding: 14, alignItems: 'center' },
  secondaryText: { color: '#005BEA', fontWeight: '900', fontSize: 11 },
});
