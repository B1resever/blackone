import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadTripLocation, TripLocation } from '../src/auth-client';
import { theme } from '../src/theme';

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

export default function LiveTripScreen() {
  const params = useLocalSearchParams<{ requestCode?: string; marketId?: string }>();
  const requestCode = readParam(params.requestCode);
  const marketId = readParam(params.marketId);
  const [location, setLocation] = useState<TripLocation | null>(null);
  const [tripStatus, setTripStatus] = useState('');
  const [message, setMessage] = useState('Connecting to ONE live tracking…');

  async function refresh() {
    if (!requestCode) return;
    try {
      const data = await loadTripLocation(requestCode);
      setLocation(data.location);
      setTripStatus(data.status);
      setMessage(data.location ? '' : 'Waiting for the driver to start live location sharing.');
    } catch {
      setMessage('Live tracking requires a signed-in ONE account attached to this reservation.');
    }
  }

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    return () => clearInterval(timer);
  }, [requestCode]);

  async function openMap() {
    if (!location) return;
    const query = encodeURIComponent(location.latitude + ',' + location.longitude);
    await Linking.openURL('https://www.google.com/maps/search/?api=1&query=' + query);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.kicker}>ONE LIVE TRACKING</Text>
        <Text style={styles.title}>Follow your ride.</Text>
        <Text style={styles.sub}>{requestCode}</Text>

        <View style={styles.map}>
          <View style={styles.routeLine} />
          <View style={styles.pin}><Text style={styles.pinText}>●</Text></View>
          <View style={styles.car}><Text style={styles.carText}>◆</Text></View>
          <Text style={styles.mapLabel}>{location ? 'LIVE DRIVER POSITION' : 'WAITING FOR DRIVER LOCATION'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>TRIP STATUS</Text>
          <Text style={styles.value}>{tripStatus ? tripStatus.replaceAll('_', ' ').toUpperCase() : 'CONNECTING'}</Text>

          {location ? (
            <>
              <Text style={styles.label}>LAST LOCATION</Text>
              <Text style={styles.coords}>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</Text>
              <Text style={styles.meta}>
                Updated {new Date(location.created_at).toLocaleTimeString()}
                {location.accuracy_meters ? ' · ±' + Math.round(location.accuracy_meters) + ' m' : ''}
              </Text>
              <Pressable style={styles.primary} onPress={openMap}>
                <Text style={styles.primaryText}>OPEN LIVE POSITION ON MAP →</Text>
              </Pressable>
            </>
          ) : <Text style={styles.message}>{message}</Text>}
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.secondary} onPress={() => router.push({ pathname: '/chat', params: { requestCode } })}>
            <Text style={styles.secondaryText}>SECURE CHAT</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => router.push({ pathname: '/trip-support', params: { requestCode, marketId } })}>
            <Text style={styles.secondaryText}>SUPPORT / SOS</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 18, flex: 1 },
  kicker: { color: theme.colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  title: { color: theme.colors.white, fontSize: 34, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.goldSoft, fontWeight: '800', marginTop: 4 },
  map: { height: 270, backgroundColor: '#081117', borderWidth: 1, borderColor: '#2B3439', borderRadius: 22, marginTop: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  routeLine: { width: 180, height: 3, backgroundColor: '#24C76A', transform: [{ rotate: '-24deg' }], opacity: 0.9 },
  pin: { position: 'absolute', left: 80, bottom: 82 },
  pinText: { color: '#24C76A', fontSize: 28 },
  car: { position: 'absolute', right: 78, top: 72, transform: [{ rotate: '24deg' }] },
  carText: { color: theme.colors.white, fontSize: 30 },
  mapLabel: { position: 'absolute', bottom: 16, color: theme.colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 16, marginTop: 14 },
  label: { color: theme.colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginTop: 5 },
  value: { color: theme.colors.white, fontWeight: '900', fontSize: 18, marginTop: 5, marginBottom: 10 },
  coords: { color: theme.colors.white, fontWeight: '800', marginTop: 5 },
  meta: { color: theme.colors.muted, fontSize: 11, marginTop: 4 },
  message: { color: theme.colors.muted, lineHeight: 19, marginTop: 8 },
  primary: { backgroundColor: theme.colors.gold, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 14 },
  primaryText: { color: '#16100A', fontWeight: '900', fontSize: 11 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 10 },
  secondary: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 13, alignItems: 'center' },
  secondaryText: { color: theme.colors.white, fontWeight: '900', fontSize: 10 },
});
