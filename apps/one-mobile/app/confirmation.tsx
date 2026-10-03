import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReservation } from '../src/reservation-context';
import { theme } from '../src/theme';

export default function ConfirmationScreen() {
  const { resetDraft } = useReservation();

  function finish() {
    resetDraft();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>✓</Text>
        </View>
        <Text style={styles.kicker}>ONE RESERVATIONS</Text>
        <Text style={styles.title}>Request received.</Text>
        <Text style={styles.body}>
          BLACK ONE received your reservation request. The ride is not dispatched until availability and final pricing are confirmed.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What happens next</Text>
          <Text style={styles.item}>1. ONE reviews route and vehicle availability.</Text>
          <Text style={styles.item}>2. Final pricing and any tolls are confirmed.</Text>
          <Text style={styles.item}>3. You receive confirmation before dispatch.</Text>
        </View>

        <Pressable style={styles.button} onPress={finish} accessibilityRole="button">
          <Text style={styles.buttonText}>BACK TO ONE</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  icon: { width: 70, height: 70, borderRadius: 35, backgroundColor: theme.colors.cyan, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconText: { color: '#001217', fontSize: 34, fontWeight: '900' },
  kicker: { color: theme.colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: theme.colors.white, fontSize: 36, fontWeight: '900', marginTop: 8 },
  body: { color: theme.colors.muted, fontSize: 15, lineHeight: 23, marginTop: 13 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 18, marginTop: 24 },
  cardTitle: { color: theme.colors.white, fontSize: 16, fontWeight: '900', marginBottom: 8 },
  item: { color: theme.colors.muted, fontSize: 13, lineHeight: 21, marginTop: 5 },
  button: { backgroundColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 17, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#001217', fontWeight: '900' },
});
