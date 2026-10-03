import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { serviceMarkets } from '../src/markets';
import { theme } from '../src/theme';

export default function BookScreen() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [marketId, setMarketId] = useState(serviceMarkets[0].id);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>ONE RESERVATIONS</Text>
        <Text style={styles.title}>Where are you going?</Text>
        <Text style={styles.sub}>
          ONE can be downloaded worldwide. Ride availability is controlled by the active service markets below.
        </Text>

        <Text style={styles.label}>Service market</Text>
        <View style={styles.marketRow}>
          {serviceMarkets.map((market) => {
            const active = market.id === marketId;
            return (
              <Pressable
                key={market.id}
                style={[styles.marketButton, active ? styles.marketButtonActive : null]}
                onPress={() => setMarketId(market.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.marketButtonText, active ? styles.marketButtonTextActive : null]}>
                  {market.countryCode === 'US' ? '🇺🇸 South Florida' : '🇦🇷 Buenos Aires'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Pickup location</Text>
        <TextInput
          value={pickup}
          onChangeText={setPickup}
          placeholder="Airport, hotel, address..."
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
          autoComplete="street-address"
          returnKeyType="next"
        />

        <Text style={styles.label}>Drop-off location</Text>
        <TextInput
          value={dropoff}
          onChangeText={setDropoff}
          placeholder="Enter destination"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
          autoComplete="street-address"
          returnKeyType="done"
        />

        <View style={styles.row}>
          <View style={styles.option}><Text style={styles.optionTitle}>One Way</Text><Text style={styles.optionText}>Selected</Text></View>
          <View style={styles.option}><Text style={styles.optionTitle}>Hourly</Text><Text style={styles.optionText}>Premium</Text></View>
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Estimate preview</Text>
          <Text style={styles.summaryText}>
            Distance, time, tolls, vehicle class and scheduled pickup will feed the final quote engine.
          </Text>
        </View>

        <Pressable style={styles.button} accessibilityRole="button">
          <Text style={styles.buttonText}>CONTINUE TO VEHICLE →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 40 },
  kicker: { color: theme.colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: theme.colors.white, fontSize: 34, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 24 },
  label: { color: theme.colors.white, fontSize: 12, fontWeight: '800', marginBottom: 8, marginTop: 14 },
  marketRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  marketButton: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 12 },
  marketButtonActive: { borderColor: theme.colors.cyan, backgroundColor: '#04202A' },
  marketButtonText: { color: theme.colors.muted, fontWeight: '800', fontSize: 11 },
  marketButtonTextActive: { color: theme.colors.cyanSoft },
  input: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.md, color: theme.colors.white, paddingHorizontal: 16, paddingVertical: 15, fontSize: 15 },
  row: { flexDirection: 'row', gap: 12, marginTop: 18 },
  option: { flex: 1, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.md, padding: 15 },
  optionTitle: { color: theme.colors.white, fontWeight: '900' },
  optionText: { color: theme.colors.cyan, marginTop: 4, fontSize: 12, fontWeight: '700' },
  summary: { backgroundColor: theme.colors.surfaceRaised, borderRadius: theme.radius.md, padding: 16, marginTop: 22 },
  summaryTitle: { color: theme.colors.white, fontWeight: '900', fontSize: 16 },
  summaryText: { color: theme.colors.muted, lineHeight: 20, marginTop: 8 },
  button: { backgroundColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 17, marginTop: 20, alignItems: 'center' },
  buttonText: { color: '#001217', fontWeight: '900' },
});
