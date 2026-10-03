import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../src/theme';

type DriverApplication = {
  marketId: 'south-florida' | 'buenos-aires';
  fullName: string;
  email: string;
  phone: string;
  licenseRegion: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  plateNumber: string;
};

const initialApplication: DriverApplication = {
  marketId: 'south-florida',
  fullName: '',
  email: '',
  phone: '',
  licenseRegion: '',
  vehicleYear: '',
  vehicleMake: '',
  vehicleModel: '',
  plateNumber: '',
};

export default function DriverScreen() {
  const [application, setApplication] = useState<DriverApplication>(initialApplication);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const valid =
    application.fullName.trim().length > 2 &&
    application.email.includes('@') &&
    application.phone.trim().length >= 7 &&
    application.licenseRegion.trim().length > 1 &&
    application.vehicleYear.trim().length === 4 &&
    application.vehicleMake.trim().length > 1 &&
    application.vehicleModel.trim().length > 1;

  function patch(next: Partial<DriverApplication>) {
    setApplication((current) => ({ ...current, ...next }));
  }

  async function submit() {
    if (!valid || submitting) return;

    const base = process.env.EXPO_PUBLIC_ONE_API_URL?.trim().replace(/\/$/, '');
    if (!base) {
      setMessage('Driver onboarding will open when ONE API is connected.');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch(base + '/api/driver-applications', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(application),
      });

      if (!response.ok) {
        setMessage('We could not submit the application. Please try again.');
        return;
      }

      const data = (await response.json()) as { applicationCode?: string };
      setMessage(
        data.applicationCode
          ? 'Application received · ' + data.applicationCode
          : 'Application received. BLACK ONE will review your information.',
      );
      setApplication(initialApplication);
    } catch {
      setMessage('ONE could not reach the driver onboarding service.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>DRIVE WITH ONE</Text>
        <Text style={styles.title}>Drive more.{'
'}Keep more.</Text>
        <Text style={styles.sub}>Apply to join ONE for scheduled transportation in an active launch market.</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>USA DRIVER MODEL</Text>
          <Text style={styles.price}>$25<Text style={styles.priceSmall}> / month</Text></Text>
          <Text style={styles.cardText}>Or 5% per trip until the monthly $25 is reached. After that, $0 platform fee for the rest of the month.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>ARGENTINA LAUNCH</Text>
          <Text style={styles.big}>First month free.</Text>
          <Text style={styles.price}>10%<Text style={styles.priceSmall}> per trip</Text></Text>
          <Text style={styles.cardText}>Scheduled reservations first, expanding area by area.</Text>
        </View>

        <Text style={styles.sectionTitle}>Driver application</Text>

        <Text style={styles.label}>Market</Text>
        <View style={styles.marketRow}>
          <Pressable
            style={[styles.marketButton, application.marketId === 'south-florida' ? styles.marketActive : null]}
            onPress={() => patch({ marketId: 'south-florida' })}
          >
            <Text style={styles.marketText}>🇺🇸 South Florida</Text>
          </Pressable>
          <Pressable
            style={[styles.marketButton, application.marketId === 'buenos-aires' ? styles.marketActive : null]}
            onPress={() => patch({ marketId: 'buenos-aires' })}
          >
            <Text style={styles.marketText}>🇦🇷 Buenos Aires</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Full name</Text>
        <TextInput style={styles.input} value={application.fullName} onChangeText={(fullName) => patch({ fullName })} placeholder="Full legal name" placeholderTextColor={theme.colors.muted} autoComplete="name" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={application.email} onChangeText={(email) => patch({ email })} placeholder="name@email.com" placeholderTextColor={theme.colors.muted} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />

        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={application.phone} onChangeText={(phone) => patch({ phone })} placeholder="+1 ..." placeholderTextColor={theme.colors.muted} keyboardType="phone-pad" autoComplete="tel" />

        <Text style={styles.label}>Driver license state / province</Text>
        <TextInput style={styles.input} value={application.licenseRegion} onChangeText={(licenseRegion) => patch({ licenseRegion })} placeholder="Florida / CABA / Province" placeholderTextColor={theme.colors.muted} />

        <View style={styles.twoCol}>
          <View style={styles.flex}>
            <Text style={styles.label}>Vehicle year</Text>
            <TextInput style={styles.input} value={application.vehicleYear} onChangeText={(vehicleYear) => patch({ vehicleYear })} placeholder="2025" placeholderTextColor={theme.colors.muted} keyboardType="number-pad" maxLength={4} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.label}>Make</Text>
            <TextInput style={styles.input} value={application.vehicleMake} onChangeText={(vehicleMake) => patch({ vehicleMake })} placeholder="Cadillac" placeholderTextColor={theme.colors.muted} />
          </View>
        </View>

        <Text style={styles.label}>Model</Text>
        <TextInput style={styles.input} value={application.vehicleModel} onChangeText={(vehicleModel) => patch({ vehicleModel })} placeholder="Escalade ESV" placeholderTextColor={theme.colors.muted} />

        <Text style={styles.label}>Plate number · optional at first step</Text>
        <TextInput style={styles.input} value={application.plateNumber} onChangeText={(plateNumber) => patch({ plateNumber })} placeholder="Vehicle plate" placeholderTextColor={theme.colors.muted} autoCapitalize="characters" />

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Verification before activation</Text>
          <Text style={styles.noticeText}>License, identity, vehicle registration, insurance, background verification and payout setup are required before a driver can receive trips.</Text>
        </View>

        <Pressable style={[styles.submit, !valid || submitting ? styles.disabled : null]} disabled={!valid || submitting} onPress={submit}>
          <Text style={styles.submitText}>{submitting ? 'SUBMITTING…' : 'SUBMIT DRIVER APPLICATION →'}</Text>
        </Pressable>

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 40 },
  kicker: { color: theme.colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: theme.colors.white, fontSize: 40, lineHeight: 42, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 12, marginBottom: 22 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 20, marginBottom: 14 },
  cardLabel: { color: theme.colors.cyan, fontSize: 11, fontWeight: '900', letterSpacing: 1.8 },
  price: { color: theme.colors.white, fontSize: 34, fontWeight: '900', marginTop: 10 },
  priceSmall: { color: theme.colors.muted, fontSize: 14, fontWeight: '700' },
  big: { color: theme.colors.white, fontSize: 21, fontWeight: '900', marginTop: 12 },
  cardText: { color: theme.colors.muted, lineHeight: 20, marginTop: 8 },
  sectionTitle: { color: theme.colors.white, fontSize: 22, fontWeight: '900', marginTop: 12, marginBottom: 4 },
  label: { color: theme.colors.white, fontSize: 12, fontWeight: '800', marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.md, color: theme.colors.white, paddingHorizontal: 16, paddingVertical: 15, fontSize: 15 },
  marketRow: { flexDirection: 'row', gap: 10 },
  marketButton: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 12 },
  marketActive: { borderColor: theme.colors.cyan, backgroundColor: '#04202A' },
  marketText: { color: theme.colors.white, fontWeight: '800', fontSize: 11 },
  twoCol: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  notice: { borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceRaised, padding: 18, marginTop: 18 },
  noticeTitle: { color: theme.colors.white, fontSize: 16, fontWeight: '900' },
  noticeText: { color: theme.colors.muted, lineHeight: 20, marginTop: 8 },
  submit: { backgroundColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 17, marginTop: 20, alignItems: 'center' },
  submitText: { color: '#001217', fontWeight: '900' },
  disabled: { opacity: 0.35 },
  message: { color: theme.colors.cyanSoft, textAlign: 'center', fontWeight: '800', marginTop: 14 },
});
