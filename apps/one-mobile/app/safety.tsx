import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../src/theme';

const items = [
  {
    icon: '⌖',
    title: 'Live Tracking',
    body: 'Open My Reservations and follow the latest live driver position after assignment.',
    action: () => router.push('/trips'),
  },
  {
    icon: '▣',
    title: 'Ride Code',
    body: 'Your ONE ride code appears in My Reservations. Share it only after the driver arrives.',
    action: () => router.push('/trips'),
  },
  {
    icon: '▤',
    title: 'Secure Chat',
    body: 'Chat is restricted to the signed-in passenger and the assigned ONE driver.',
    action: () => router.push('/trips'),
  },
  {
    icon: 'SOS',
    title: 'Emergency Support',
    body: 'Open BLACK ONE support or emergency-call options when immediate help is needed.',
    action: () => router.push('/trip-support'),
  },
] as const;

export default function SafetyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>ONE SAFETY</Text>
        <Text style={styles.title}>Know your driver.{'\n'}Know your ride.</Text>
        <Text style={styles.sub}>
          Driver verification, vehicle matching, live trip tools and support are connected to the ONE reservation flow.
        </Text>

        {items.map((item) => (
          <Pressable key={item.title} style={styles.card} onPress={item.action} accessibilityRole="button">
            <View style={styles.icon}>
              <Text style={styles.iconText}>{item.icon}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.body}</Text>
              <Text style={styles.open}>OPEN →</Text>
            </View>
          </Pressable>
        ))}

        <View style={styles.note}>
          <Text style={styles.noteTitle}>B1 · Safety rules / Reglas de seguridad</Text>
          <Text style={styles.noteText}>No alcohol or drugs while driving or available for rides. Report suspected impairment to B1 Support; call 911 for immediate danger.</Text>
          <Text style={styles.noteText}>Cero alcohol o drogas al conducir o estar disponible. Reportá una sospecha a Soporte B1; llamá al 911 ante peligro inmediato.</Text>
          <Text style={styles.noteText}>No discrimination. Service animals and disability-related accommodations must follow applicable law; no extra charge because of a disability.</Text>
          <Text style={styles.noteText}>Sin discriminación. Se deben respetar las normas sobre animales de servicio y accesibilidad; sin recargos por discapacidad.</Text>
          <Text style={styles.noteText}>Confirm the driver, vehicle and plate before boarding. Follow designated airport/port pickup locations. All rides must be arranged through B1.</Text>
          <Text style={styles.noteText}>Verificá chofer, vehículo y matrícula antes de subir. Respetá los puntos habilitados en aeropuertos y puertos. Los viajes se coordinan por B1.</Text>
          <Pressable onPress={() => Linking.openURL('tel:+13058501737')} accessibilityRole="button" style={{ paddingVertical: 14 }}>
            <Text style={styles.open}>REPORT SAFETY CONCERN / REPORTAR SEGURIDAD →</Text>
          </Pressable>
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Safety sequence</Text>
          <Text style={styles.noteText}>
            ONE verifies the driver, vehicle and compliance before assignment. At pickup, the driver must verify the passenger ride code before the trip can move to Passenger Onboard.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 40 },
  kicker: { color: theme.colors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: theme.colors.text, fontSize: 36, lineHeight: 38, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 12, marginBottom: 20 },
  card: { flexDirection: 'row', gap: 14, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 16, marginBottom: 12 },
  icon: { width: 42, height: 42, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.gold, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: theme.colors.goldSoft, fontWeight: '900', fontSize: 11 },
  copy: { flex: 1 },
  cardTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '900' },
  cardBody: { color: theme.colors.muted, lineHeight: 20, marginTop: 5 },
  open: { color: theme.colors.goldSoft, fontSize: 10, fontWeight: '900', marginTop: 10, letterSpacing: .7 },
  note: { backgroundColor: theme.colors.selected, borderWidth: 1, borderColor: theme.colors.gold, borderRadius: theme.radius.lg, padding: 16, marginTop: 6 },
  noteTitle: { color: theme.colors.goldSoft, fontWeight: '900', fontSize: 16 },
  noteText: { color: theme.colors.muted, lineHeight: 20, marginTop: 7 },
});
