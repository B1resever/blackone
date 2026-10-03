import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReservation } from '../src/reservation-context';
import { vehicleCatalog } from '../src/reservation';
import { theme } from '../src/theme';

export default function VehiclesScreen() {
  const { draft, updateDraft } = useReservation();

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>STEP 2 OF 3</Text>
        <Text style={styles.title}>Choose your ONE</Text>
        <Text style={styles.sub}>
          Select the vehicle category for this reservation. Final availability and price are confirmed before dispatch.
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
              <View style={styles.cardTop}>
                <View style={styles.vehicleMark}>
                  <Text style={styles.vehicleMarkText}>ONE</Text>
                </View>
                {selected ? <Text style={styles.selectedBadge}>SELECTED</Text> : null}
              </View>
              <Text style={styles.name}>{vehicle.name}</Text>
              <Text style={styles.detail}>{vehicle.subtitle}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>👤 {vehicle.passengers}</Text>
                <Text style={styles.meta}>▣ {vehicle.luggage}</Text>
              </View>
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
  content: { padding: 20, paddingBottom: 44 },
  kicker: { color: theme.colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: theme.colors.white, fontSize: 34, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 22 },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 18,
    marginBottom: 12,
  },
  cardSelected: { borderColor: theme.colors.cyan, backgroundColor: '#04202A' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleMark: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#073B50', alignItems: 'center', justifyContent: 'center' },
  vehicleMarkText: { color: theme.colors.cyanSoft, fontWeight: '900', letterSpacing: 1 },
  selectedBadge: { color: '#001217', backgroundColor: theme.colors.cyan, paddingHorizontal: 10, paddingVertical: 6, borderRadius: theme.radius.pill, fontSize: 9, fontWeight: '900' },
  name: { color: theme.colors.white, fontSize: 20, fontWeight: '900', marginTop: 16 },
  detail: { color: theme.colors.muted, fontSize: 13, marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: 14, marginTop: 13 },
  meta: { color: theme.colors.cyanSoft, fontSize: 11, fontWeight: '700' },
  button: { backgroundColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 17, marginTop: 12, alignItems: 'center' },
  buttonDisabled: { opacity: 0.35 },
  buttonText: { color: '#001217', fontWeight: '900' },
});
