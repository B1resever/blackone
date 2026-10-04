import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../src/theme';

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

export default function TripSupportScreen() {
  const params = useLocalSearchParams<{ requestCode?: string; marketId?: string }>();
  const requestCode = readParam(params.requestCode);
  const marketId = readParam(params.marketId);

  async function call(url: string) {
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  }

  function emergency(number: string, label: string) {
    Alert.alert(
      label,
      'This will open the phone dialer for an emergency service. ONE support is not a replacement for emergency responders.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: () => void call('tel:' + number) },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>ONE SAFETY</Text>
        <Text style={styles.title}>Support & emergency.</Text>
        <Text style={styles.sub}>{requestCode ? 'Trip ' + requestCode : 'BLACK ONE support'}</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>BLACK ONE SUPPORT</Text>
          <Text style={styles.cardTitle}>Reservation & trip assistance</Text>
          <Text style={styles.cardBody}>For pickup coordination, trip questions, driver contact issues or reservation support.</Text>
          <Pressable style={styles.primary} onPress={() => call('tel:+13058501737')}>
            <Text style={styles.primaryText}>CALL +1 305-850-1737</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => call('sms:+13058501737')}>
            <Text style={styles.secondaryText}>TEXT BLACK ONE</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => call('mailto:reservations@blackonetransportation.com?subject=ONE%20Trip%20Support%20' + encodeURIComponent(requestCode))}>
            <Text style={styles.secondaryText}>EMAIL SUPPORT</Text>
          </Pressable>
        </View>

        <View style={styles.emergencyCard}>
          <Text style={styles.emergencyLabel}>EMERGENCY SERVICES</Text>
          <Text style={styles.emergencyTitle}>Immediate danger or medical emergency?</Text>
          <Text style={styles.emergencyBody}>Contact local emergency services first. BLACK ONE cannot dispatch police, fire or medical responders.</Text>

          <Pressable style={styles.sos} onPress={() => emergency('911', 'Call 911?')}>
            <Text style={styles.sosText}>SOS · CALL 911</Text>
          </Pressable>

          {marketId === 'buenos-aires' ? (
            <Pressable style={styles.medical} onPress={() => emergency('107', 'Call SAME 107?')}>
              <Text style={styles.medicalText}>BUENOS AIRES MEDICAL · SAME 107</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 18, paddingBottom: 40 },
  kicker: { color: theme.colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  title: { color: theme.colors.white, fontSize: 34, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.muted, marginTop: 7, marginBottom: 18 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 17 },
  cardLabel: { color: theme.colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  cardTitle: { color: theme.colors.white, fontWeight: '900', fontSize: 19, marginTop: 8 },
  cardBody: { color: theme.colors.muted, lineHeight: 20, marginTop: 7 },
  primary: { backgroundColor: theme.colors.gold, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  primaryText: { color: '#16100A', fontWeight: '900' },
  secondary: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 8 },
  secondaryText: { color: theme.colors.white, fontWeight: '900', fontSize: 11 },
  emergencyCard: { borderWidth: 1, borderColor: theme.colors.danger, borderRadius: theme.radius.lg, padding: 17, marginTop: 16, backgroundColor: '#16080B' },
  emergencyLabel: { color: theme.colors.danger, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  emergencyTitle: { color: theme.colors.white, fontSize: 19, fontWeight: '900', marginTop: 8 },
  emergencyBody: { color: '#C9AEB3', lineHeight: 20, marginTop: 7 },
  sos: { backgroundColor: theme.colors.danger, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 16 },
  sosText: { color: theme.colors.white, fontWeight: '900' },
  medical: { borderWidth: 1, borderColor: theme.colors.danger, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 9 },
  medicalText: { color: theme.colors.danger, fontWeight: '900', fontSize: 10 },
});
