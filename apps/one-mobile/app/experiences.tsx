import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Service = 'cars' | 'jets' | 'boats';
const labels: Record<Service, string> = { cars: 'Luxury Cars', jets: 'Private Jets', boats: 'Yachts & Boats' };
const tabs: { id: Service; title: string; subtitle: string }[] = [
  { id: 'cars', title: 'Cars', subtitle: 'Premium rides' },
  { id: 'jets', title: 'Jets', subtitle: 'Private aviation' },
  { id: 'boats', title: 'Boats', subtitle: 'Private charters' },
];
export default function ExperiencesScreen() {
  const [selected, setSelected] = useState<Service>('cars');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState('2');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  function requestQuote() {
    if (!from.trim() || !date.trim() || !email.trim() || (selected === 'jets' && !to.trim())) {
      setNotice('Complete the required details before requesting a quote.');
      return;
    }
    // Until a contracted aviation/marine API is available, do not pretend to submit a booking.
    setNotice('Quote requests for this service are not yet connected. No reservation or charge has been made.');
  }
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <View><Text style={s.logo}>B1 <Text style={s.logoAccent}>ONE</Text></Text><Text style={s.caption}>PRIVATE MOBILITY</Text></View>
          <Pressable onPress={() => router.push('/account')} accessibilityRole="button"><Text style={s.account}>ACCOUNT</Text></Pressable>
        </View>
        <Text style={s.eyebrow}>THE ONE EXPERIENCE</Text>
        <Text style={s.title}>Where can we take you?</Text>
        <Text style={s.description}>Select a service to start your reservation.</Text>
        <View style={s.tabs}>
          {tabs.map(tab => (
            <Pressable key={tab.id} onPress={() => {setSelected(tab.id);setNotice('');}} style={[s.tab, selected === tab.id && s.tabSelected]} accessibilityRole="button" accessibilityState={{ selected: selected === tab.id }}>
              <Text style={[s.tabTitle, selected === tab.id && s.selectedText]}>{tab.title}</Text>
              <Text style={s.tabSub}>{tab.subtitle}</Text>
            </Pressable>
          ))}
        </View>
        <View style={s.panel}>
          <Text style={s.eyebrow}>{labels[selected].toUpperCase()}</Text>
          {selected === 'cars' ? (
            <>
              <Text style={s.panelTitle}>A better way to ride.</Text>
              <Text style={s.description}>Airport transfer, point-to-point, hourly chauffeur and luxury vehicles.</Text>
              <Pressable style={s.primary} onPress={() => router.push('/book')} accessibilityRole="button"><Text style={s.primaryText}>BOOK A RIDE  →</Text></Pressable>
              <Pressable style={s.secondary} onPress={() => router.push('/trips')} accessibilityRole="button"><Text style={s.secondaryText}>My reservations</Text></Pressable>
            </>
          ) : (
            <>
              <Text style={s.panelTitle}>{selected === 'jets' ? 'Private aviation' : 'Explore by sea'}</Text>
              <Text style={s.description}>Service preview. Operator availability, confirmed pricing and booking are not yet enabled.</Text>
              <Text style={s.label}>{selected === 'jets' ? 'Departure airport or city' : 'Departure marina or city'} *</Text>
              <TextInput style={s.input} value={from} onChangeText={setFrom} placeholder="Enter location" placeholderTextColor="#8295A4" />
              {selected === 'jets' && <><Text style={s.label}>Destination *</Text><TextInput style={s.input} value={to} onChangeText={setTo} placeholder="Enter destination" placeholderTextColor="#8295A4" /></>}
              <Text style={s.label}>Date *</Text>
              <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor="#8295A4" />
              <Text style={s.label}>Passengers *</Text>
              <TextInput style={s.input} value={passengers} onChangeText={setPassengers} keyboardType="number-pad" />
              <Text style={s.label}>Email *</Text>
              <TextInput style={s.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" placeholderTextColor="#8295A4" />
              <Text style={s.label}>Special requests</Text>
              <TextInput style={[s.input, { height: 90 }]} value={details} onChangeText={setDetails} multiline placeholder="Flexible dates, equipment, luggage…" placeholderTextColor="#8295A4" />
              <Pressable style={s.primary} onPress={requestQuote} accessibilityRole="button"><Text style={s.primaryText}>CHECK REQUEST STATUS</Text></Pressable>
              {notice ? <Text style={s.notice} accessibilityRole="alert">{notice}</Text> : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5FAFD' },
  page: { padding: 22, paddingBottom: 45 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 38 },
  logo: { fontSize: 27, fontWeight: '900', color: '#12314B', letterSpacing: -1 },
  logoAccent: { color: '#028FE3', fontSize: 17, letterSpacing: 2 },
  caption: { color: '#657E91', fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  account: { color: '#1C76AB', fontSize: 12, fontWeight: '800' },
  eyebrow: { color: '#087FBF', fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  title: { fontSize: 34, lineHeight: 40, color: '#102C45', fontWeight: '800', letterSpacing: -1, marginTop: 13 },
  description: { color: '#576F83', lineHeight: 22, marginTop: 9, fontSize: 15 },
  tabs: { flexDirection: 'row', gap: 9, marginTop: 30 },
  tab: { flex: 1, borderWidth: 1, borderColor: '#D6E6F0', borderRadius: 16, padding: 13, backgroundColor: '#FFF', minHeight: 82 },
  tabSelected: { borderColor: '#028FE3', borderWidth: 2, backgroundColor: '#EAF7FF' },
  tabTitle: { fontWeight: '800', color: '#153E5A', fontSize: 17 },
  selectedText: { color: '#007CCB' },
  tabSub: { color: '#71899A', fontSize: 11, marginTop: 5 },
  panel: { borderWidth: 1, borderColor: '#DCEAF1', backgroundColor: '#FFF', borderRadius: 22, padding: 22, marginTop: 20 },
  panelTitle: { color: '#12314B', fontSize: 26, fontWeight: '800', marginTop: 12 },
  label: { color: '#263E51', fontSize: 13, fontWeight: '700', marginTop: 17, marginBottom: 6 },
  input: { color: '#12314B', borderColor: '#D4E3EC', borderWidth: 1, borderRadius: 12, padding: 14, backgroundColor: '#FFF', minHeight: 50 },
  primary: { backgroundColor: '#078EDC', borderRadius: 13, padding: 16, alignItems: 'center', marginTop: 25 },
  primaryText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  secondary: { marginTop: 17, alignItems: 'center' },
  secondaryText: { color: '#087FBF', fontSize: 14, fontWeight: '700' },
  notice: { marginTop: 17, color: '#8C5B21', lineHeight: 20, fontSize: 13 },
});