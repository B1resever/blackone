import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const airports = [
  { code: 'KOPF', name: 'Miami-Opa Locka Executive', city: 'Miami' },
  { code: 'KTMB', name: 'Miami Executive', city: 'Miami' },
  { code: 'KFXE', name: 'Fort Lauderdale Executive', city: 'Fort Lauderdale' },
  { code: 'KPBI', name: 'Palm Beach International', city: 'West Palm Beach' },
];

export default function AviationRadarScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.page}>
        <Text style={s.eyebrow}>B1 PRIVATE AVIATION</Text>
        <Text style={s.title}>Live Jet Radar</Text>
        <Text style={s.body}>Track private aviation movements and discover executive airports.</Text>
        <View style={s.status}>
          <Text style={s.statusTitle}>LIVE TRACKING NOT CONNECTED</Text>
          <Text style={s.body}>A licensed aviation data provider is required before real aircraft positions, routes or arrival times can be displayed. No simulated flights are shown.</Text>
        </View>
        <Text style={s.heading}>South Florida aviation hubs</Text>
        {airports.map(a => (
          <View key={a.code} style={s.airport}>
            <Text style={s.code}>{a.code}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.airportName}>{a.name}</Text>
              <Text style={s.city}>{a.city}</Text>
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
});
