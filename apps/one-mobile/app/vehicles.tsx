import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReservation } from '../src/reservation-context';
import { vehicleCatalog } from '../src/reservation';
import { theme } from '../src/theme';

const images: Record<string, string> = {
  confort: 'https://raw.githubusercontent.com/B1resever/blackone/main/images/fleet/electric.png',
  xl: 'https://raw.githubusercontent.com/B1resever/blackone/main/images/fleet/Sprinter.png',
  'suv-black': 'https://raw.githubusercontent.com/B1resever/blackone/main/images/fleet/Escalade.png',
  'ultra-exclusive': 'https://raw.githubusercontent.com/B1resever/blackone/main/images/fleet/cullinan.png',
};

export default function VehiclesScreen() {
  const { draft, updateDraft } = useReservation();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>STEP 2 OF 3 · ONE</Text>
        <Text style={styles.title}>Choose your ONE.</Text>
        <Text style={styles.sub}>
          Select the vehicle category for this reservation. Availability and final pricing are confirmed before dispatch.
        </Text>

        {vehicleCatalog.map((vehicle) => {
          const selected = draft.vehicleClass === vehicle.id;
          return (
            <Pressable
              key={vehicle.id}
              style={[styles.card, selected ? styles.cardSelected : null]}
              onPress={() => updateDraft({ vehicleClass: vehicle.id })}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Image source={{ uri: images[vehicle.id] }} style={styles.image} />
              <View style={styles.overlay} />

              <View style={styles.top}>
                <Text style={styles.category}>ONE VEHICLE</Text>
                {selected ? <Text style={styles.selected}>SELECTED</Text> : null}
              </View>

              <View style={styles.copy}>
                <Text style={styles.name}>{vehicle.name}</Text>
                <Text style={styles.detail}>{vehicle.subtitle}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>● {vehicle.passengers}</Text>
                  <Text style={styles.meta}>▣ {vehicle.luggage}</Text>
                </View>
              </View>

              <View style={styles.arrow}><Text style={styles.arrowText}>›</Text></View>
            </Pressable>
          );
        })}

        <Pressable
          style={[styles.button, !draft.vehicleClass ? styles.buttonDisabled : null]}
          disabled={!draft.vehicleClass}
          onPress={() => router.push('/review')}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>REVIEW RESERVATION →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 44 },
  kicker: { color: theme.colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 2.1 },
  title: { color: theme.colors.white, fontSize: 36, lineHeight: 37, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 20 },
  card: {
    height: 218,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#30383D',
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
  },
  cardSelected: { borderColor: theme.colors.gold, borderWidth: 2 },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,.32)' },
  top: { position: 'absolute', left: 14, right: 14, top: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { color: theme.colors.goldSoft, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  selected: { color: '#16100A', backgroundColor: theme.colors.gold, borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 6, fontSize: 9, fontWeight: '900' },
  copy: { position: 'absolute', left: 15, right: 48, bottom: 15 },
  name: { color: theme.colors.white, fontSize: 22, fontWeight: '900' },
  detail: { color: '#EBE8E1', fontSize: 12, marginTop: 3 },
  metaRow: { flexDirection: 'row', gap: 14, marginTop: 10 },
  meta: { color: theme.colors.goldSoft, fontSize: 10, fontWeight: '800' },
  arrow: { position: 'absolute', right: 14, bottom: 14, width: 34, height: 34, borderRadius: 18, borderWidth: 1, borderColor: '#D8D2C7', backgroundColor: 'rgba(2,6,9,.55)', alignItems: 'center', justifyContent: 'center' },
  arrowText: { color: theme.colors.white, fontSize: 24, marginTop: -2 },
  button: { backgroundColor: theme.colors.gold, borderRadius: 13, padding: 17, marginTop: 8, alignItems: 'center' },
  buttonDisabled: { opacity: 0.35 },
  buttonText: { color: '#16100A', fontWeight: '900' },
});
