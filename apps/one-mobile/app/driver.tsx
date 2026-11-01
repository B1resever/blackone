import { fetchJsonResponse } from '../src/http-client';
import { useRef, useState } from 'react';
import { router } from 'expo-router';
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
  vehicleColor: string;
  passengerCapacity: number;
  payoutMethod: 'bank_transfer' | 'zelle' | 'coordinate_with_b1';
  whatsappConsent: boolean;
  vehicleClassId: 'xl' | 'suv-black';
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
  vehicleColor: '',
  passengerCapacity: 6,
  payoutMethod: 'coordinate_with_b1',
  whatsappConsent: false,
  vehicleClassId: 'suv-black',
};

export default function DriverScreen() {
  const pending = useRef(false);
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
    application.vehicleModel.trim().length > 1 &&
    application.vehicleColor.trim().length > 0 &&
    application.plateNumber.trim().length > 0 &&
    application.whatsappConsent &&
    Number.isInteger(application.passengerCapacity) && application.passengerCapacity >= 1 &&
    application.passengerCapacity <= (application.vehicleClassId === 'suv-black' ? 6 : 7);

  function patch(next: Partial<DriverApplication>) {
    setApplication((current) => ({ ...current, ...next, ...(next.marketId === 'buenos-aires' && current.payoutMethod === 'zelle' ? { payoutMethod: 'coordinate_with_b1' as const } : {}) }));
  }

  async function submit() {
    if (!valid || submitting || pending.current) return;

    const base = process.env.EXPO_PUBLIC_ONE_API_URL?.trim().replace(/\/$/, '');
    if (!base) {
      setMessage('Driver onboarding will open when ONE API is connected.');
      return;
    }

    pending.current = true;
    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetchJsonResponse(base + '/one/api/driver-applications', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(application),
      });

      if (!response.ok) {
        setMessage('Application not confirmed. Contact B1 before submitting again.');
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
      setMessage('Submission result could not be confirmed. Contact B1 before submitting again.');
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>DRIVE WITH ONE</Text>
        <Text style={styles.title}>Drive more.{'\n'}Keep more.</Text>
        <Text style={styles.sub}>Apply to join ONE for scheduled transportation in an active launch market.</Text>

        <Pressable style={styles.accessButton} onPress={() => router.push('/driver-access')}>
          <Text style={styles.accessText}>ALREADY APPROVED? DRIVER ACCESS →</Text>
        </Pressable>

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

        <Text style={styles.label}>WhatsApp phone / Teléfono</Text>
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

        <Text style={styles.label}>ONE vehicle category</Text>
        <View style={styles.categoryGrid}>
          {[
            ['suv-black', 'SUV BLACK'],
            ['xl', 'XL'],
          ].map(([id, label]) => {
            const active = application.vehicleClassId === id;
            return (
              <Pressable
                key={id}
                style={[styles.categoryButton, active ? styles.categoryActive : null]}
                onPress={() => patch({ vehicleClassId: id as DriverApplication['vehicleClassId'] })}
              >
                <Text style={[styles.categoryText, active ? styles.categoryTextActive : null]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Plate number / Matrícula</Text>
        <TextInput style={styles.input} value={application.plateNumber} onChangeText={(plateNumber) => patch({ plateNumber })} placeholder="Vehicle plate" placeholderTextColor={theme.colors.muted} autoCapitalize="characters" />

        <Text style={styles.label}>Vehicle color / Color del vehículo</Text>
        <TextInput style={styles.input} value={application.vehicleColor} onChangeText={(vehicleColor) => patch({ vehicleColor })} placeholder="Black / Negro" placeholderTextColor={theme.colors.muted} maxLength={40} />
        <Text style={styles.label}>Passenger seats, excluding driver / Pasajeros sin conductor</Text>
        <TextInput style={styles.input} value={String(application.passengerCapacity || '')} onChangeText={(value) => patch({ passengerCapacity: Number(value) })} keyboardType="number-pad" maxLength={1} />

        <Text style={styles.sectionTitle}>How to receive payment / Cómo cobrar</Text>
        <Text style={styles.sub}>Choose a preference. B1 still needs to verify your payout destination before payment. Do not enter banking details here.</Text>
        {([
          ['bank_transfer', 'Bank transfer / Transferencia bancaria'],
          ...(application.marketId === 'south-florida' ? [['zelle', 'Zelle · USA']] : []),
          ['coordinate_with_b1', 'Coordinate with B1 / Coordinar con B1'],
        ] as Array<[DriverApplication['payoutMethod'], string]>).map(([id, label]) => (
          <Pressable key={id} style={[styles.marketButton, application.payoutMethod === id && styles.marketActive]} onPress={() => patch({ payoutMethod: id })} accessibilityRole="radio" accessibilityState={{ checked: application.payoutMethod === id }}>
            <Text style={styles.marketText}>{label}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.notice} onPress={() => patch({ whatsappConsent: !application.whatsappConsent })} accessibilityRole="checkbox" accessibilityState={{ checked: application.whatsappConsent }}>
          <Text style={styles.noticeText}>{application.whatsappConsent ? '☑' : '☐'} I agree to receive B1 trip offers and operational messages on WhatsApp. / Acepto recibir ofertas de viajes y mensajes operativos de B1 por WhatsApp.</Text>
        </Pressable>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Verification before activation</Text>
          <Text style={styles.noticeText}>Next: current license, insurance, vehicle registration and a vehicle photo. B1 coordinates any additional checks before activation. / Luego: licencia, seguro y registración vigentes, y foto del vehículo. B1 coordina las verificaciones adicionales.</Text>
        </View>

        <Text style={styles.sub}>{application.marketId === 'south-florida' ? 'USA platform fee: $25/month or 5% per trip until the monthly $25 cap is reached.' : 'Argentina: first-month membership free; 10% per trip from day one.'}</Text>

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
  title: { color: theme.colors.text, fontSize: 40, lineHeight: 42, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.muted, fontSize: 14, lineHeight: 21, marginTop: 12, marginBottom: 22 },
  accessButton: { borderWidth: 1, borderColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 14, alignItems: 'center', marginBottom: 18 },
  accessText: { color: theme.colors.cyanSoft, fontWeight: '900', fontSize: 11 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 20, marginBottom: 14 },
  cardLabel: { color: theme.colors.cyan, fontSize: 11, fontWeight: '900', letterSpacing: 1.8 },
  price: { color: theme.colors.text, fontSize: 34, fontWeight: '900', marginTop: 10 },
  priceSmall: { color: theme.colors.muted, fontSize: 14, fontWeight: '700' },
  big: { color: theme.colors.text, fontSize: 21, fontWeight: '900', marginTop: 12 },
  cardText: { color: theme.colors.muted, lineHeight: 20, marginTop: 8 },
  sectionTitle: { color: theme.colors.text, fontSize: 22, fontWeight: '900', marginTop: 12, marginBottom: 4 },
  label: { color: theme.colors.text, fontSize: 12, fontWeight: '800', marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.md, color: theme.colors.text, paddingHorizontal: 16, paddingVertical: 15, fontSize: 15 },
  marketRow: { flexDirection: 'row', gap: 10 },
  marketButton: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 12 },
  marketActive: { borderColor: theme.colors.cyan, backgroundColor: theme.colors.selected },
  marketText: { color: theme.colors.text, fontWeight: '800', fontSize: 11 },
  twoCol: { flexDirection: 'row', gap: 12 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryButton: { width: '48%', borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 12, alignItems: 'center' },
  categoryActive: { borderColor: theme.colors.cyan, backgroundColor: theme.colors.selected },
  categoryText: { color: theme.colors.muted, fontWeight: '900', fontSize: 11 },
  categoryTextActive: { color: theme.colors.cyanSoft },
  flex: { flex: 1 },
  notice: { borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceRaised, padding: 18, marginTop: 18 },
  noticeTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '900' },
  noticeText: { color: theme.colors.muted, lineHeight: 20, marginTop: 8 },
  submit: { backgroundColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 17, marginTop: 20, alignItems: 'center' },
  submitText: { color: theme.colors.onAccent, fontWeight: '900' },
  disabled: { opacity: 0.35 },
  message: { color: theme.colors.cyanSoft, textAlign: 'center', fontWeight: '800', marginTop: 14 },
});
