import { featuredAviationAirports } from '../src/aviation-airports';
import { aviationRegions } from '../src/aviation-regions';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { fetchAviationFeed, type AviationFeedResult } from '../src/aviation-feed';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AviationRadarScreen() {
  const [radar, setRadar] = useState<AviationFeedResult>({ status: 'unconfigured' });
  const mapRef = useRef<MapView>(null);
  useEffect(() => {
    const controller = new AbortController();
    const load = () => fetchAviationFeed(process.env.EXPO_PUBLIC_B1_AVIATION_FEED_URL, controller.signal)
      .then(result => { if (!controller.signal.aborted) setRadar(result); });
    void load();
    const refresh = setInterval(() => { void load(); }, 60000);
    return () => { clearInterval(refresh); controller.abort(); };
  }, []);
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.page}>
        <Text style={s.eyebrow}>B1 PRIVATE AVIATION</Text>
        <Text style={s.title}>Live Jet Radar</Text>
        <Text style={s.body}>Track private aviation movements and discover executive airports.</Text>
        {radar.status !== 'ready' && <View style={s.status}>
          <Text style={s.statusTitle}>{radar.status === 'unconfigured' ? 'LIVE TRACKING NOT CONNECTED' : radar.status === 'stale' ? 'AIRCRAFT DATA OUTDATED' : 'LIVE TRACKING UNAVAILABLE'}</Text>
          <Text style={s.body}>A licensed aviation data provider is required to display verified aircraft positions. No simulated flights are shown.</Text>
        </View>}
        <Text style={s.heading}>Aviation map</Text>
        <Text style={s.disclaimer}>{radar.status === 'ready' ? `Source: ${radar.feed.source} · Updated: ${radar.feed.updatedAt}` : 'Featured airports only. Live aircraft data is not connected.'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }} contentContainerStyle={{ gap: 8 }}>
          {aviationRegions.map(region => (
            <Pressable key={region.id} accessibilityRole="button" style={s.region} onPress={() => mapRef.current?.animateToRegion({ latitude: region.latitude, longitude: region.longitude, latitudeDelta: region.latitudeDelta, longitudeDelta: region.longitudeDelta }, 500)}>
              <Text style={s.regionText}>{region.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <MapView ref={mapRef} style={{ height: 310, borderRadius: 18, marginTop: 12 }} initialRegion={{ latitude: 24.8, longitude: -78, latitudeDelta: 15, longitudeDelta: 24 }}>
          {featuredAviationAirports.map(airport => (
            <Marker key={airport.icao} coordinate={{ latitude: airport.latitude, longitude: airport.longitude }} title={airport.name} description={airport.iata} pinColor="#087FBF" />
          ))}
          {radar.status === 'ready' && radar.feed.flights.map(flight => (
            <Marker key={flight.id} coordinate={{ latitude: flight.latitude, longitude: flight.longitude }} title={flight.registration || flight.aircraftType || 'Aircraft'} description={[flight.originIcao, flight.destinationIcao].filter(Boolean).join(' → ')} pinColor="#D18A13" />
          ))}
        </MapView>
        {radar.status === 'unavailable' && <Text style={s.disclaimer}>{radar.message}</Text>}
        {radar.status === 'stale' && <Text style={s.disclaimer}>Last data update: {radar.updatedAt}. Aircraft positions are hidden until current data is available.</Text>}
        <Text style={s.heading}>Explore live aircraft externally</Text>
        <Text style={s.disclaimer}>These services open in your browser. They are not connected to B1 and may have different coverage or privacy restrictions.</Text>
        <Pressable accessibilityRole="link" style={s.external} onPress={() => { void Linking.openURL('https://globe.adsbexchange.com/'); }}>
          <Text style={s.externalText}>OPEN ADS-B EXCHANGE ↗</Text>
        </Pressable>
        <Pressable accessibilityRole="link" style={s.external} onPress={() => { void Linking.openURL('https://www.flightradar24.com/'); }}>
          <Text style={s.externalText}>OPEN FLIGHTRADAR24 ↗</Text>
        </Pressable>
        <Text style={s.heading}>Featured Florida, Caribbean & Mexico airports</Text>
        {featuredAviationAirports.map(a => (
          <View key={a.icao} style={s.airport}>
            <Text style={s.code}>{a.iata}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.airportName}>{a.name}</Text>
              <Text style={s.city}>{a.region}</Text>
            </View>
          </View>
        ))}
        <Text style={s.disclaimer}>Flight tracking does not indicate charter availability. Charter quotes and empty-leg offers require verified operators.</Text>
        <Pressable accessibilityRole="button" style={s.button} onPress={() => router.replace('/experiences')}>
          <Text style={s.buttonText}>BACK TO PRIVATE JETS</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5FAFD' },
  page: { padding: 22, paddingBottom: 48 },
  eyebrow: { color: '#087FBF', fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  title: { fontSize: 32, fontWeight: '800', color: '#102C45', marginTop: 10 },
  body: { fontSize: 15, color: '#576F83', lineHeight: 23, marginTop: 8 },
  status: { backgroundColor: '#EAF7FF', borderColor: '#C7E5F5', borderWidth: 1, padding: 18, borderRadius: 18, marginTop: 24 },
  statusTitle: { color: '#125C85', fontWeight: '800', fontSize: 13 },
  heading: { fontSize: 21, fontWeight: '800', color: '#102C45', marginTop: 30, marginBottom: 14 },
  airport: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCEAF1', borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  code: { color: '#007CCB', fontSize: 16, fontWeight: '900', width: 55 },
  airportName: { color: '#12314B', fontWeight: '700', fontSize: 14 },
  city: { color: '#657E91', marginTop: 3, fontSize: 12 },
  disclaimer: { color: '#657E91', fontSize: 12, lineHeight: 18, marginTop: 18 },
  button: { backgroundColor: '#078EDC', padding: 16, borderRadius: 13, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#FFFFFF', fontWeight: '800' },
  external: { marginTop: 10, padding: 15, borderRadius: 13, backgroundColor: '#FFFFFF', borderColor: '#C7E5F5', borderWidth: 1 },
  externalText: { color: '#087FBF', fontWeight: '800', fontSize: 13 },
  region: { backgroundColor: '#EAF7FF', borderColor: '#C7E5F5', borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  regionText: { color: '#125C85', fontWeight: '700', fontSize: 13 },
});
