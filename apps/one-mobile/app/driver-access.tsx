import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  activateDriverAccount,
  DriverDocument,
  DriverFeeSummary,
  DriverTrip,
  loadDriverAvailability,
  loadDriverDocuments,
  loadDriverFees,
  loadDriverTrips,
  createDriverFeeCheckout,
  setDriverAvailability,
  submitDriverDocument,
  updateDriverTrip,
} from '../src/auth-client';
import { useAuth } from '../src/auth-context';
import { theme } from '../src/theme';

type DriverStatus = 'driver_en_route' | 'arrived' | 'passenger_onboard' | 'completed';
type DocumentType = 'driver_license' | 'insurance' | 'vehicle_registration' | 'background_check';

const nextStatus: Record<string, { status: DriverStatus; label: string } | null> = {
  assigned: { status: 'driver_en_route', label: 'START TRIP · EN ROUTE' },
  confirmed: { status: 'driver_en_route', label: 'START TRIP · EN ROUTE' },
  driver_en_route: { status: 'arrived', label: 'MARK ARRIVED' },
  arrived: { status: 'passenger_onboard', label: 'PASSENGER ONBOARD' },
  passenger_onboard: { status: 'completed', label: 'COMPLETE TRIP' },
  completed: null,
};

const requiredDocuments: Array<{ id: DocumentType; label: string }> = [
  { id: 'driver_license', label: 'Driver License' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'vehicle_registration', label: 'Vehicle Registration' },
  { id: 'background_check', label: 'Background Check' },
];

export default function DriverAccessScreen() {
  const { user, refresh, logout } = useAuth();
  const [applicationCode, setApplicationCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [availability, setAvailabilityState] = useState(false);
  const [feeSummary, setFeeSummary] = useState<DriverFeeSummary | null>(null);
  const [complianceStatus, setComplianceStatus] = useState('pending');
  const [selectedDocument, setSelectedDocument] = useState<DocumentType>('driver_license');
  const [documentNumber, setDocumentNumber] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  async function refreshDriverData() {
    if (user?.role !== 'driver') return;
    setLoadingTrips(true);
    try {
      const [nextTrips, nextAvailability, nextDocuments, nextFees] = await Promise.all([
        loadDriverTrips(),
        loadDriverAvailability(),
        loadDriverDocuments(),
        loadDriverFees(),
      ]);
      setTrips(nextTrips);
      setDocuments(nextDocuments);
      setFeeSummary(nextFees);
      setAvailabilityState(Boolean(nextAvailability?.available_for_assignment));
      setComplianceStatus(nextAvailability?.compliance_status ?? 'pending');
    } catch {
      setMessage('ONE could not load driver operations.');
    } finally {
      setLoadingTrips(false);
    }
  }

  useEffect(() => {
    void refreshDriverData();
  }, [user?.id, user?.role]);

  async function activate() {
    if (working) return;
    setWorking(true);
    setMessage('');
    try {
      await activateDriverAccount(applicationCode.trim(), email.trim(), password);
      await refresh();
      setPassword('');
      setMessage('Driver account activated.');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setMessage(
        code === 'driver_not_approved'
          ? 'This driver application has not been approved yet.'
          : 'ONE could not activate this driver account.',
      );
    } finally {
      setWorking(false);
    }
  }

  async function moveTrip(trip: DriverTrip, status: DriverStatus) {
    setWorking(true);
    setMessage('');
    try {
      await updateDriverTrip(trip.request_code, status);
      await refreshDriverData();
    } catch {
      setMessage('Trip status could not be updated.');
    } finally {
      setWorking(false);
    }
  }

  async function toggleAvailability() {
    setWorking(true);
    setMessage('');
    try {
      const result = await setDriverAvailability(!availability);
      setAvailabilityState(Boolean(result.available));
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setMessage(code === 'driver_not_compliant'
        ? 'Complete and obtain approval for all required driver documents before going available.'
        : 'Availability could not be updated.');
    } finally {
      setWorking(false);
    }
  }

  async function payMonthlyFee() {
    if (working) return;
    setWorking(true);
    setMessage('');
    try {
      const checkout = await createDriverFeeCheckout();
      if (checkout.checkoutUrl) {
        await Linking.openURL(checkout.checkoutUrl);
      }
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setMessage(
        code === 'monthly_cap_already_covered'
          ? 'Your ONE monthly platform fee is already covered.'
          : 'ONE could not open the monthly platform fee payment.',
      );
    } finally {
      setWorking(false);
    }
  }

  async function submitComplianceDocument() {
    setWorking(true);
    setMessage('');
    try {
      await submitDriverDocument({
        documentType: selectedDocument,
        documentNumber: documentNumber.trim() || undefined,
        expiresOn: expiresOn.trim() || undefined,
        fileUrl: fileUrl.trim() || undefined,
      });
      setDocumentNumber('');
      setExpiresOn('');
      setFileUrl('');
      setMessage('Document submitted for BLACK ONE review.');
      await refreshDriverData();
    } catch {
      setMessage('Document could not be submitted. Check the expiration date and optional document link.');
    } finally {
      setWorking(false);
    }
  }

  function latestDocument(type: DocumentType) {
    return documents.find((document) => document.document_type === type);
  }

  if (user?.role === 'driver') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.kicker}>ONE DRIVER</Text>
          <Text style={styles.title}>Driver operations.</Text>
          <Text style={styles.sub}>Compliance, availability and assigned reservations are controlled from your ONE driver account.</Text>

          <View style={styles.profile}>
            <Text style={styles.profileName}>{user.fullName}</Text>
            <Text style={styles.profileMeta}>{user.email}</Text>
            <Text style={[styles.compliance, complianceStatus === 'approved' ? styles.complianceOk : null]}>
              COMPLIANCE · {complianceStatus.toUpperCase()}
            </Text>
          </View>

          <View style={styles.availabilityCard}>
            <View style={styles.availabilityText}>
              <Text style={styles.sectionTitle}>Driver availability</Text>
              <Text style={styles.meta}>
                {availability ? 'You can receive compatible ONE assignments.' : 'You are currently unavailable for new assignments.'}
              </Text>
            </View>
            <Pressable
              style={[styles.availabilityButton, availability ? styles.availabilityOn : null]}
              onPress={toggleAvailability}
              disabled={working}
            >
              <Text style={styles.availabilityButtonText}>{availability ? 'AVAILABLE' : 'OFFLINE'}</Text>
            </Pressable>
          </View>

          {feeSummary ? (
            <View style={styles.feeCard}>
              <Text style={styles.cardLabel}>ONE DRIVER PLATFORM FEE</Text>
              {feeSummary.isExempt ? (
                <>
                  <Text style={styles.feeAmount}>FIRST MONTH FREE</Text>
                  <Text style={styles.meta}>
                    Fee exemption through {feeSummary.feeExemptUntil ? new Date(feeSummary.feeExemptUntil).toLocaleDateString() : 'launch period'}.
                  </Text>
                </>
              ) : feeSummary.feeModel === 'monthly_cap' ? (
                <>
                  <Text style={styles.feeAmount}>
                    {new Intl.NumberFormat(undefined, { style: 'currency', currency: feeSummary.currency }).format((feeSummary.coveredAmountMinor ?? 0) / 100)}
                    <Text style={styles.feeSmall}> / {new Intl.NumberFormat(undefined, { style: 'currency', currency: feeSummary.currency }).format((feeSummary.monthlyCapAmountMinor ?? 0) / 100)}</Text>
                  </Text>
                  <Text style={styles.meta}>
                    5% per completed paid trip until the monthly cap is reached. You can also pay the remaining balance directly.
                  </Text>
                  {(feeSummary.remainingAmountMinor ?? 0) > 0 ? (
                    <Pressable style={styles.secondary} onPress={payMonthlyFee} disabled={working}>
                      <Text style={styles.secondaryText}>
                        PAY REMAINING {new Intl.NumberFormat(undefined, { style: 'currency', currency: feeSummary.currency }).format((feeSummary.remainingAmountMinor ?? 0) / 100)}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.feeCovered}>MONTHLY FEE COVERED</Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.feeAmount}>{Math.round(feeSummary.percentPerTrip * 100)}% <Text style={styles.feeSmall}>per completed paid trip</Text></Text>
                  <Text style={styles.meta}>ONE records the platform fee in your monthly driver ledger.</Text>
                </>
              )}
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Required documents</Text>
          <Text style={styles.sectionHelp}>BLACK ONE must approve all four required items before ONE allows new trip assignments.</Text>

          {requiredDocuments.map((item) => {
            const document = latestDocument(item.id);
            return (
              <View key={item.id} style={styles.documentRow}>
                <View style={styles.flex}>
                  <Text style={styles.documentName}>{item.label}</Text>
                  <Text style={styles.meta}>
                    {document
                      ? document.status.toUpperCase() + (document.expires_on ? ' · expires ' + document.expires_on : '')
                      : 'NOT SUBMITTED'}
                  </Text>
                </View>
              </View>
            );
          })}

          <View style={styles.documentForm}>
            <Text style={styles.cardLabel}>SUBMIT / REPLACE DOCUMENT</Text>
            <View style={styles.documentTypes}>
              {requiredDocuments.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.typeButton, selectedDocument === item.id ? styles.typeActive : null]}
                  onPress={() => setSelectedDocument(item.id)}
                >
                  <Text style={[styles.typeText, selectedDocument === item.id ? styles.typeTextActive : null]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Document number · optional</Text>
            <TextInput style={styles.input} value={documentNumber} onChangeText={setDocumentNumber} placeholder="License / policy / registration number" placeholderTextColor={theme.colors.muted} />

            <Text style={styles.label}>Expiration date · YYYY-MM-DD</Text>
            <TextInput style={styles.input} value={expiresOn} onChangeText={setExpiresOn} placeholder="2027-10-03" placeholderTextColor={theme.colors.muted} />

            <Text style={styles.label}>Secure document link · optional until storage is connected</Text>
            <TextInput style={styles.input} value={fileUrl} onChangeText={setFileUrl} placeholder="https://..." placeholderTextColor={theme.colors.muted} autoCapitalize="none" />

            <Pressable style={styles.secondary} onPress={submitComplianceDocument} disabled={working}>
              <Text style={styles.secondaryText}>SUBMIT FOR REVIEW</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Assigned trips</Text>
          {loadingTrips ? <Text style={styles.message}>Loading driver operations…</Text> : null}
          {!loadingTrips && trips.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No assigned trips.</Text>
              <Text style={styles.emptyText}>New compatible reservations will appear here after BLACK ONE assigns them.</Text>
            </View>
          ) : null}

          {trips.map((trip) => {
            const action = nextStatus[trip.status] ?? null;
            return (
              <View key={trip.request_code} style={styles.trip}>
                <View style={styles.tripTop}>
                  <Text style={styles.code}>{trip.request_code}</Text>
                  <Text style={styles.status}>{trip.status.replaceAll('_', ' ').toUpperCase()}</Text>
                </View>
                <Text style={styles.route}>{trip.pickup_text}</Text>
                {trip.dropoff_text ? <Text style={styles.route}>→ {trip.dropoff_text}</Text> : null}
                <Text style={styles.meta}>{trip.pickup_date_text} · {trip.pickup_time_text}</Text>
                <Text style={styles.meta}>{trip.vehicle_class_id.toUpperCase()} · {trip.passenger_count} passenger(s)</Text>
                {trip.guest_full_name ? <Text style={styles.passenger}>{trip.guest_full_name}</Text> : null}
                {trip.guest_phone ? <Text style={styles.meta}>{trip.guest_phone}</Text> : null}
                {action ? (
                  <Pressable style={styles.primary} disabled={working} onPress={() => moveTrip(trip, action.status)}>
                    <Text style={styles.primaryText}>{working ? 'UPDATING…' : action.label}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}

          <Pressable style={styles.secondary} onPress={refreshDriverData}>
            <Text style={styles.secondaryText}>REFRESH DRIVER DATA</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={logout}>
            <Text style={styles.secondaryText}>SIGN OUT DRIVER</Text>
          </Pressable>

          {message ? <Text style={styles.message}>{message}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>ONE DRIVER ACCESS</Text>
        <Text style={styles.title}>Activate approved driver access.</Text>
        <Text style={styles.sub}>
          After BLACK ONE approves your driver application, use the application code and email to create your driver password.
        </Text>

        <Text style={styles.label}>Approved application code</Text>
        <TextInput style={styles.input} value={applicationCode} onChangeText={setApplicationCode} placeholder="DRV-..." placeholderTextColor={theme.colors.muted} autoCapitalize="characters" />

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="name@email.com" placeholderTextColor={theme.colors.muted} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>Create driver password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="At least 10 characters" placeholderTextColor={theme.colors.muted} secureTextEntry />

        <Pressable
          style={[styles.primary, applicationCode.length < 8 || !email.includes('@') || password.length < 10 ? styles.disabled : null]}
          disabled={applicationCode.length < 8 || !email.includes('@') || password.length < 10 || working}
          onPress={activate}
        >
          <Text style={styles.primaryText}>{working ? 'ACTIVATING…' : 'ACTIVATE DRIVER ACCOUNT →'}</Text>
        </Pressable>

        <Text style={styles.message}>If the driver account is already activated, sign in through My ONE using the same email and password.</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 44 },
  kicker: { color: theme.colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: theme.colors.white, fontSize: 34, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.muted, lineHeight: 21, marginTop: 10, marginBottom: 20 },
  sectionTitle: { color: theme.colors.white, fontSize: 19, fontWeight: '900', marginTop: 18 },
  sectionHelp: { color: theme.colors.muted, lineHeight: 19, marginTop: 6, marginBottom: 10 },
  cardLabel: { color: theme.colors.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  label: { color: theme.colors.white, fontSize: 12, fontWeight: '800', marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.md, color: theme.colors.white, paddingHorizontal: 16, paddingVertical: 15 },
  primary: { backgroundColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 15, alignItems: 'center', marginTop: 16 },
  primaryText: { color: '#001217', fontWeight: '900', textAlign: 'center' },
  disabled: { opacity: 0.35 },
  secondary: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, alignItems: 'center', marginTop: 10 },
  secondaryText: { color: theme.colors.white, fontWeight: '900' },
  message: { color: theme.colors.muted, lineHeight: 19, textAlign: 'center', marginTop: 14 },
  profile: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 15, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 14 },
  profileName: { color: theme.colors.white, fontWeight: '900', fontSize: 18 },
  profileMeta: { color: theme.colors.muted, marginTop: 4 },
  compliance: { color: theme.colors.danger, marginTop: 9, fontWeight: '900', fontSize: 11 },
  complianceOk: { color: theme.colors.cyan },
  availabilityCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: theme.colors.surfaceRaised, borderRadius: theme.radius.md, padding: 15, borderWidth: 1, borderColor: theme.colors.border },
  availabilityText: { flex: 1 },
  availabilityButton: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, paddingVertical: 10 },
  availabilityOn: { backgroundColor: theme.colors.cyan, borderColor: theme.colors.cyan },
  availabilityButtonText: { color: theme.colors.white, fontWeight: '900', fontSize: 10 },
  feeCard: { backgroundColor: theme.colors.surfaceRaised, borderRadius: theme.radius.lg, padding: 16, borderWidth: 1, borderColor: theme.colors.border, marginTop: 16 },
  feeAmount: { color: theme.colors.white, fontWeight: '900', fontSize: 25, marginTop: 9 },
  feeSmall: { color: theme.colors.muted, fontSize: 12, fontWeight: '700' },
  feeCovered: { color: theme.colors.cyan, fontWeight: '900', marginTop: 12 },
  documentRow: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 13, borderWidth: 1, borderColor: theme.colors.border, marginTop: 8, flexDirection: 'row' },
  documentName: { color: theme.colors.white, fontWeight: '900' },
  documentForm: { backgroundColor: theme.colors.surfaceRaised, borderRadius: theme.radius.lg, padding: 16, marginTop: 14 },
  documentTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  typeButton: { width: '48%', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 10 },
  typeActive: { borderColor: theme.colors.cyan, backgroundColor: '#04202A' },
  typeText: { color: theme.colors.muted, fontWeight: '800', fontSize: 10 },
  typeTextActive: { color: theme.colors.cyanSoft },
  flex: { flex: 1 },
  empty: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 20, borderWidth: 1, borderColor: theme.colors.border, marginTop: 10 },
  emptyTitle: { color: theme.colors.white, fontWeight: '900', fontSize: 17 },
  emptyText: { color: theme.colors.muted, marginTop: 6 },
  trip: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 17, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12, marginTop: 10 },
  tripTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  code: { color: theme.colors.cyanSoft, fontWeight: '900' },
  status: { color: theme.colors.cyan, fontWeight: '900', fontSize: 10, maxWidth: 140, textAlign: 'right' },
  route: { color: theme.colors.white, fontWeight: '800', marginTop: 10 },
  meta: { color: theme.colors.muted, marginTop: 5, fontSize: 12 },
  passenger: { color: theme.colors.white, fontWeight: '900', marginTop: 12 },
});
