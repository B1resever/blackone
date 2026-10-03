import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { serviceMarkets } from '../src/markets';
import { isTripDetailsComplete, RideType } from '../src/reservation';
import { useReservation } from '../src/reservation-context';
import { theme } from '../src/theme';
import { useAuth } from '../src/auth-context';

const rideTypes: Array<{ id: RideType; label: string }> = [
  { id: 'one-way', label: 'One Way' },
  { id: 'hourly', label: 'Hourly' },
  { id: 'round-trip', label: 'Round Trip' },
];

export default function BookScreen() {
  const { draft, updateDraft } = useReservation();
  const { user } = useAuth();
  const canContinue = useMemo(() => isTripDetailsComplete(draft), [draft]);

  useEffect(() => {
    if (!user || user.role !== 'passenger') return;
    updateDraft({
      fullName: draft.fullName || user.fullName,
      email: draft.email || user.email || '',
      phone: draft.phone || user.phone || '',
    });
  }, [user?.id]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>STEP 1 OF 3 · ONE RESERVATIONS</Text>
        <Text style={styles.title}>Plan your ride.</Text>
        <Text style={styles.sub}>
          Scheduled reservations are the first operating stage. Choose your market and complete the trip details.
        </Text>

        <Text style={styles.label}>Service market</Text>
        <View style={styles.marketRow}>
          {serviceMarkets.map((market) => {
            const active = market.id === draft.marketId;
            return (
              <Pressable
                key={market.id}
                style={[styles.marketButton, active ? styles.marketButtonActive : null]}
                onPress={() => updateDraft({ marketId: market.id })}
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

        <Text style={styles.label}>Ride type</Text>
        <View style={styles.rideRow}>
          {rideTypes.map((item) => {
            const active = draft.rideType === item.id;
            return (
              <Pressable
                key={item.id}
                style={[styles.rideButton, active ? styles.rideButtonActive : null]}
                onPress={() => updateDraft({ rideType: item.id })}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.rideText, active ? styles.rideTextActive : null]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Pickup location</Text>
        <TextInput
          value={draft.pickup}
          onChangeText={(pickup) => updateDraft({ pickup })}
          placeholder="Airport, hotel, address..."
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
          autoComplete="street-address"
          returnKeyType="next"
        />

        {draft.rideType !== 'hourly' ? (
          <>
            <Text style={styles.label}>Drop-off location</Text>
            <TextInput
              value={draft.dropoff}
              onChangeText={(dropoff) => updateDraft({ dropoff })}
              placeholder="Enter destination"
              placeholderTextColor={theme.colors.muted}
              style={styles.input}
              autoComplete="street-address"
              returnKeyType="next"
            />
          </>
        ) : null}

        <View style={styles.twoCol}>
          <View style={styles.flex}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              value={draft.pickupDate}
              onChangeText={(pickupDate) => updateDraft({ pickupDate })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={theme.colors.muted}
              style={styles.input}
              keyboardType="numbers-and-punctuation"
            />
          </View>
          <View style={styles.flex}>
            <Text style={styles.label}>Time</Text>
            <TextInput
              value={draft.pickupTime}
              onChangeText={(pickupTime) => updateDraft({ pickupTime })}
              placeholder="10:00 AM"
              placeholderTextColor={theme.colors.muted}
              style={styles.input}
            />
          </View>
        </View>

        {draft.rideType === 'round-trip' ? (
          <View style={styles.twoCol}>
            <View style={styles.flex}>
              <Text style={styles.label}>Return date</Text>
              <TextInput
                value={draft.returnDate}
                onChangeText={(returnDate) => updateDraft({ returnDate })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.colors.muted}
                style={styles.input}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.label}>Return time</Text>
              <TextInput
                value={draft.returnTime}
                onChangeText={(returnTime) => updateDraft({ returnTime })}
                placeholder="6:00 PM"
                placeholderTextColor={theme.colors.muted}
                style={styles.input}
              />
            </View>
          </View>
        ) : null}

        {draft.rideType === 'hourly' ? (
          <>
            <Text style={styles.label}>Hours</Text>
            <View style={styles.passengerRow}>
              {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((hours) => {
                const active = draft.hourlyHours === hours;
                return (
                  <Pressable
                    key={hours}
                    style={[styles.passengerButton, active ? styles.passengerButtonActive : null]}
                    onPress={() => updateDraft({ hourlyHours: hours })}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.passengerText, active ? styles.passengerTextActive : null]}>{hours}h</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <Text style={styles.label}>Passengers</Text>
        <View style={styles.passengerRow}>
          {[1, 2, 3, 4, 5, 6, 7].map((count) => {
            const active = draft.passengers === count;
            return (
              <Pressable
                key={count}
                style={[styles.passengerButton, active ? styles.passengerButtonActive : null]}
                onPress={() => updateDraft({ passengers: count })}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.passengerText, active ? styles.passengerTextActive : null]}>{count}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Passenger information</Text>

        <Text style={styles.label}>Full name</Text>
        <TextInput
          value={draft.fullName}
          onChangeText={(fullName) => updateDraft({ fullName })}
          placeholder="Passenger name"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
          autoComplete="name"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={draft.email}
          onChangeText={(email) => updateDraft({ email })}
          placeholder="name@email.com"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          value={draft.phone}
          onChangeText={(phone) => updateDraft({ phone })}
          placeholder="+1 ..."
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
          keyboardType="phone-pad"
          autoComplete="tel"
        />

        <Text style={styles.label}>Notes · optional</Text>
        <TextInput
          value={draft.notes}
          onChangeText={(notes) => updateDraft({ notes })}
          placeholder="Flight, luggage, accessibility, special request..."
          placeholderTextColor={theme.colors.muted}
          style={[styles.input, styles.notes]}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Pricing</Text>
          <Text style={styles.summaryText}>
            Route distance, travel time, tolls and the selected vehicle will be used to calculate the final quote. No charge is made on this step.
          </Text>
        </View>

        <Pressable
          style={[styles.button, !canContinue ? styles.buttonDisabled : null]}
          disabled={!canContinue}
          onPress={() => router.push('/vehicles')}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>CONTINUE TO VEHICLE →</Text>
        </Pressable>

        {!canContinue ? <Text style={styles.helper}>Complete the required trip and passenger details to continue.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 44 },
  kicker: { color: theme.colors.cyan, fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  title: { color: theme.colors.white, fontSize: 35, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 22 },
  sectionTitle: { color: theme.colors.white, fontSize: 20, fontWeight: '900', marginBottom: 4 },
  label: { color: theme.colors.white, fontSize: 12, fontWeight: '800', marginBottom: 8, marginTop: 14 },
  marketRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  marketButton: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 12 },
  marketButtonActive: { borderColor: theme.colors.cyan, backgroundColor: '#04202A' },
  marketButtonText: { color: theme.colors.muted, fontWeight: '800', fontSize: 11 },
  marketButtonTextActive: { color: theme.colors.cyanSoft },
  rideRow: { flexDirection: 'row', gap: 8 },
  rideButton: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.pill, paddingVertical: 10, alignItems: 'center' },
  rideButtonActive: { backgroundColor: theme.colors.cyan, borderColor: theme.colors.cyan },
  rideText: { color: theme.colors.muted, fontWeight: '800', fontSize: 11 },
  rideTextActive: { color: '#001217' },
  input: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.md, color: theme.colors.white, paddingHorizontal: 16, paddingVertical: 15, fontSize: 15 },
  notes: { minHeight: 96 },
  twoCol: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  passengerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  passengerButton: { minWidth: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  passengerButtonActive: { backgroundColor: theme.colors.cyan, borderColor: theme.colors.cyan },
  passengerText: { color: theme.colors.muted, fontWeight: '900' },
  passengerTextActive: { color: '#001217' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginTop: 27, marginBottom: 20 },
  summary: { backgroundColor: theme.colors.surfaceRaised, borderRadius: theme.radius.md, padding: 16, marginTop: 22 },
  summaryTitle: { color: theme.colors.white, fontWeight: '900', fontSize: 16 },
  summaryText: { color: theme.colors.muted, lineHeight: 20, marginTop: 8 },
  button: { backgroundColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 17, marginTop: 20, alignItems: 'center' },
  buttonDisabled: { opacity: 0.35 },
  buttonText: { color: '#001217', fontWeight: '900' },
  helper: { color: theme.colors.muted, textAlign: 'center', fontSize: 11, marginTop: 10 },
});
