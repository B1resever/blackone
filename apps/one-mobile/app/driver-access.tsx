import { PickupDetails, type AirportPickupDetails } from '../src/pickup-details';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import type { LocationSubscription } from 'expo-location';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  activateDriverAccount,
  getSessionToken,
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
  verifyRideCode,
} from '../src/auth-client';
import { useAuth } from '../src/auth-context';
import { theme } from '../src/theme';
import { startOneDriverLocationSharing } from '../src/driver-location';

type DriverStatus = 'driver_en_route' | 'arrived' | 'passenger_onboard' | 'completed';
type DocumentType = 'driver_license' | 'insurance' | 'vehicle_registration' | 'background_check' | 'other';

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
  { id: 'other', label: 'Vehicle photo / Foto del vehículo' },
];

export default function DriverAccessScreen() {
  const { user, refresh, logout } = useAuth();
  const documentOwner = useRef(user?.id);
  documentOwner.current = user?.id;
  const uploadToken = useRef<string | null>(null);
  const documentSubmitting = useRef(false);
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
  const [upload, setUpload] = useState<{ mimeType: 'image/jpeg' | 'image/png'; base64: string } | null>(null);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');
  const [rideCodes, setRideCodes] = useState<Record<string, string>>({});
  const [sharingCode, setSharingCode] = useState('');
  const locationSubscription = useRef<LocationSubscription | null>(null);
  const locationRequest = useRef<AbortController | null>(null);

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
    setUpload(null);
    uploadToken.current = null;
    setDocumentNumber('');
    setExpiresOn('');
    void refreshDriverData();
  }, [user?.id, user?.role]);

  useEffect(() => {
    setSharingCode('');
    setWorking(false);
    return () => {
      locationRequest.current?.abort();
      locationSubscription.current?.remove();
      locationSubscription.current = null;
    };
  }, [user?.id]);

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
      if (status === 'completed' && sharingCode === trip.request_code) {
        locationRequest.current?.abort();
        locationSubscription.current?.remove();
        locationSubscription.current = null;
        setSharingCode('');
      }
      await refreshDriverData();
    } catch {
      setMessage('Trip status could not be updated.');
    } finally {
      setWorking(false);
    }
  }

  async function verifyPassengerCode(trip: DriverTrip) {
    const code = (rideCodes[trip.request_code] ?? '').trim().toUpperCase();
    if (!code) {
      setMessage('Enter the passenger ride code first.');
      return;
    }

    setWorking(true);
    setMessage('');
    try {
      await verifyRideCode(trip.request_code, code);
      setRideCodes((current) => ({ ...current, [trip.request_code]: '' }));
      setMessage('Ride code verified. The trip can now start.');
      await refreshDriverData();
    } catch (error) {
      const codeName = error instanceof Error ? error.message : '';
      setMessage(codeName === 'invalid_ride_code' ? 'Ride code does not match.' : 'ONE could not verify the ride code.');
    } finally {
      setWorking(false);
    }
  }

  async function toggleLiveLocation(trip: DriverTrip) {
    if (working) return;
    if (sharingCode === trip.request_code) {
      locationRequest.current?.abort();
      locationSubscription.current?.remove();
      locationSubscription.current = null;
      setSharingCode('');
      setMessage('Live location sharing stopped.');
      return;
    }

    setWorking(true);
    setMessage('');
    locationRequest.current?.abort();
    const controller = new AbortController();
    locationRequest.current = controller;
    try {
      locationSubscription.current?.remove();
      locationSubscription.current = await startOneDriverLocationSharing(trip.request_code, setMessage, controller.signal);
      setSharingCode(trip.request_code);
      setMessage('Live location is active while ONE Driver remains open.');
    } catch (error) {
      if (controller.signal.aborted) return;
      const codeName = error instanceof Error ? error.message : '';
      setMessage(codeName === 'location_permission_denied' ? 'Location permission is required for live trip tracking.' : 'ONE could not start live location sharing.');
    } finally {
      if (!controller.signal.aborted) setWorking(false);
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

  async function chooseDocumentImage() {
    const owner = documentOwner.current;
    try {
      const token = await getSessionToken();
      if (!token || owner !== documentOwner.current) return;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.65, allowsMultipleSelection: false });
      if (result.canceled || owner !== documentOwner.current) return;
      const asset = result.assets[0];
      const base64 = asset.base64;
      if (!base64 || Math.floor(base64.length * 3 / 4) > 2 * 1024 * 1024) { setMessage('Choose a JPEG or PNG image under 2 MB. / Elegí una imagen de menos de 2 MB.'); return; }
      const mimeType = base64.startsWith('iVBORw0KGgo') ? 'image/png' : base64.startsWith('/9j/') ? 'image/jpeg' : null;
      if (!mimeType) { setMessage('Select a JPEG or PNG image. / Seleccioná una imagen JPEG o PNG.'); return; }
      uploadToken.current = token;
      setUpload({ mimeType, base64 });
      setMessage('Image selected. Submit it for B1 review. / Imagen seleccionada. Enviala para revisión.');
    } catch { setMessage('Could not open photos. Check photo permissions. / No se pudieron abrir las fotos.'); }
  }

  async function submitComplianceDocument() {
    if (working || documentSubmitting.current || !upload || !uploadToken.current) return;
    documentSubmitting.current = true;
    const owner = documentOwner.current;
    setWorking(true);
    setMessage('');
    try {
      await submitDriverDocument({
        documentType: selectedDocument,
        documentNumber: selectedDocument === 'other' ? 'vehicle_photo' : documentNumber.trim() || undefined,
        expiresOn: selectedDocument === 'other' ? undefined : expiresOn.trim() || undefined,
        fileUpload: upload,
      }, uploadToken.current);
      if (owner !== documentOwner.current) return;
      setDocumentNumber('');
      setExpiresOn('');
      setUpload(null);
      setMessage('Document submitted for BLACK ONE review.');
      await refreshDriverData();
    } catch {
      setMessage('Submission not confirmed. Refresh documents before retrying. Use a current expiry date and an image under 2 MB.');
    } finally {
      documentSubmitting.current = false;
      setWorking(false);
    }
  }

  function latestDocument(type: DocumentType) {
    return documents.find((document) => document.document_type === type && (type !== 'other' || document.document_number === 'vehicle_photo'));
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
              <Text style={[styles.availabilityButtonText, availability && styles.availabilityOnText]}>{availability ? 'AVAILABLE' : 'OFFLINE'}</Text>
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
          <Text style={styles.sectionHelp}>Upload these essentials for B1 review. Additional screening is coordinated by B1 before activation. / Subí estos datos esenciales; B1 coordina las verificaciones adicionales.</Text>

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
                  onPress={() => { setSelectedDocument(item.id); setUpload(null); setDocumentNumber(''); setExpiresOn(''); }}
                >
                  <Text style={[styles.typeText, selectedDocument === item.id ? styles.typeTextActive : null]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>

            {selectedDocument !== 'other' ? <>
              <Text style={styles.label}>Document number · optional / Número opcional</Text>
              <TextInput style={styles.input} value={documentNumber} onChangeText={setDocumentNumber} placeholder="License / policy / registration" placeholderTextColor={theme.colors.muted} />
              <Text style={styles.label}>Expiration / Vencimiento · YYYY-MM-DD</Text>
              <TextInput style={styles.input} value={expiresOn} onChangeText={setExpiresOn} placeholder="2027-10-03" placeholderTextColor={theme.colors.muted} />
            </> : null}
            <Pressable style={styles.secondary} onPress={chooseDocumentImage} disabled={working} accessibilityRole="button">
              <Text style={styles.secondaryText}>{upload ? 'REPLACE SELECTED PHOTO / CAMBIAR FOTO' : 'CHOOSE PHOTO / ELEGIR FOTO'}</Text>
            </Pressable>
            <Text style={styles.sectionHelp}>JPEG/PNG · max 2 MB. Private: only you and authorized B1 Operations can open the uploaded file.</Text>

            <Pressable style={styles.secondary} onPress={submitComplianceDocument} disabled={working || !upload}>
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
            const action = trip.status === 'arrived' && !trip.ride_code_verified
              ? null
              : nextStatus[trip.status] ?? null;
            const activeForLocation = ['assigned', 'driver_en_route', 'arrived', 'passenger_onboard'].includes(trip.status);
            return (
              <View key={trip.request_code} style={styles.trip}>
                <View style={styles.tripTop}>
                  <Text style={styles.code}>{trip.request_code}</Text>
                  <Text style={styles.status}>{trip.status.replaceAll('_', ' ').toUpperCase()}</Text>
                </View>
                <Text style={styles.route}>{trip.pickup_text}</Text>
                <PickupDetails details={trip.pickup_details} />
                {trip.dropoff_text ? <Text style={styles.route}>→ {trip.dropoff_text}</Text> : null}
                <Text style={styles.meta}>{trip.pickup_date_text} · {trip.pickup_time_text}</Text>
                <Text style={styles.meta}>{trip.vehicle_class_id.toUpperCase()} · {trip.passenger_count} passenger(s)</Text>
                {trip.guest_full_name ? <Text style={styles.passenger}>{trip.guest_full_name}</Text> : null}
                {trip.guest_phone ? <Text style={styles.meta}>{trip.guest_phone}</Text> : null}

                {activeForLocation ? (
                  <Pressable
                    style={[styles.secondary, sharingCode === trip.request_code ? styles.liveActive : null]}
                    onPress={() => toggleLiveLocation(trip)}
                    disabled={working}
                  >
                    <Text style={styles.secondaryText}>
                      {sharingCode === trip.request_code ? 'STOP LIVE LOCATION' : 'START LIVE LOCATION'}
                    </Text>
                  </Pressable>
                ) : null}

                <View style={styles.tripTools}>
                  <Pressable
                    style={styles.toolButton}
                    onPress={() => router.push({ pathname: '/chat', params: { requestCode: trip.request_code } })}
                  >
                    <Text style={styles.toolText}>SECURE CHAT</Text>
                  </Pressable>
                  <Pressable
                    style={styles.toolButton}
                    onPress={() => router.push({ pathname: '/trip-support', params: { requestCode: trip.request_code, marketId: trip.market_id } })}
                  >
                    <Text style={styles.toolText}>SUPPORT / SOS</Text>
                  </Pressable>
                </View>

                {trip.status === 'arrived' && !trip.ride_code_verified ? (
                  <View style={styles.codeVerify}>
                    <Text style={styles.cardLabel}>VERIFY PASSENGER RIDE CODE</Text>
                    <Text style={styles.meta}>Ask the passenger for the ONE ride code shown in My Reservations.</Text>
                    <TextInput
                      style={styles.codeInput}
                      value={rideCodes[trip.request_code] ?? ''}
                      onChangeText={(rideCode) => setRideCodes((current) => ({ ...current, [trip.request_code]: rideCode.toUpperCase() }))}
                      placeholder="ABC234"
                      placeholderTextColor={theme.colors.muted}
                      autoCapitalize="characters"
                      maxLength={12}
                    />
                    <Pressable style={styles.primary} onPress={() => verifyPassengerCode(trip)} disabled={working}>
                      <Text style={styles.primaryText}>VERIFY RIDE CODE</Text>
                    </Pressable>
                  </View>
                ) : null}

                {trip.ride_code_verified ? (
                  <Text style={styles.verifiedText}>✓ RIDE CODE VERIFIED</Text>
                ) : null}

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
  title: { color: theme.colors.text, fontSize: 34, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.muted, lineHeight: 21, marginTop: 10, marginBottom: 20 },
  sectionTitle: { color: theme.colors.text, fontSize: 19, fontWeight: '900', marginTop: 18 },
  sectionHelp: { color: theme.colors.muted, lineHeight: 19, marginTop: 6, marginBottom: 10 },
  cardLabel: { color: theme.colors.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  label: { color: theme.colors.text, fontSize: 12, fontWeight: '800', marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.md, color: theme.colors.text, paddingHorizontal: 16, paddingVertical: 15 },
  primary: { backgroundColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 15, alignItems: 'center', marginTop: 16 },
  primaryText: { color: theme.colors.onAccent, fontWeight: '900', textAlign: 'center' },
  disabled: { opacity: 0.35 },
  secondary: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, alignItems: 'center', marginTop: 10 },
  secondaryText: { color: theme.colors.text, fontWeight: '900' },
  message: { color: theme.colors.muted, lineHeight: 19, textAlign: 'center', marginTop: 14 },
  profile: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 15, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 14 },
  profileName: { color: theme.colors.text, fontWeight: '900', fontSize: 18 },
  profileMeta: { color: theme.colors.muted, marginTop: 4 },
  compliance: { color: theme.colors.danger, marginTop: 9, fontWeight: '900', fontSize: 11 },
  complianceOk: { color: theme.colors.cyan },
  availabilityCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: theme.colors.surfaceRaised, borderRadius: theme.radius.md, padding: 15, borderWidth: 1, borderColor: theme.colors.border },
  availabilityText: { flex: 1 },
  availabilityButton: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, paddingVertical: 10 },
  availabilityOn: { backgroundColor: theme.colors.cyan, borderColor: theme.colors.cyan },
  availabilityOnText: { color: theme.colors.onAccent },
  availabilityButtonText: { color: theme.colors.text, fontWeight: '900', fontSize: 10 },
  feeCard: { backgroundColor: theme.colors.surfaceRaised, borderRadius: theme.radius.lg, padding: 16, borderWidth: 1, borderColor: theme.colors.border, marginTop: 16 },
  feeAmount: { color: theme.colors.text, fontWeight: '900', fontSize: 25, marginTop: 9 },
  feeSmall: { color: theme.colors.muted, fontSize: 12, fontWeight: '700' },
  feeCovered: { color: theme.colors.cyan, fontWeight: '900', marginTop: 12 },
  documentRow: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: 13, borderWidth: 1, borderColor: theme.colors.border, marginTop: 8, flexDirection: 'row' },
  documentName: { color: theme.colors.text, fontWeight: '900' },
  documentForm: { backgroundColor: theme.colors.surfaceRaised, borderRadius: theme.radius.lg, padding: 16, marginTop: 14 },
  documentTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  typeButton: { width: '48%', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 10 },
  typeActive: { borderColor: theme.colors.cyan, backgroundColor: theme.colors.selected },
  typeText: { color: theme.colors.muted, fontWeight: '800', fontSize: 10 },
  typeTextActive: { color: theme.colors.cyanSoft },
  flex: { flex: 1 },
  empty: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 20, borderWidth: 1, borderColor: theme.colors.border, marginTop: 10 },
  emptyTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 17 },
  emptyText: { color: theme.colors.muted, marginTop: 6 },
  trip: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, padding: 17, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12, marginTop: 10 },
  tripTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  code: { color: theme.colors.cyanSoft, fontWeight: '900' },
  status: { color: theme.colors.cyan, fontWeight: '900', fontSize: 10, maxWidth: 140, textAlign: 'right' },
  route: { color: theme.colors.text, fontWeight: '800', marginTop: 10 },
  meta: { color: theme.colors.muted, marginTop: 5, fontSize: 12 },
  passenger: { color: theme.colors.text, fontWeight: '900', marginTop: 12 },
  liveActive: { borderColor: theme.colors.green, backgroundColor: theme.colors.selected },
  tripTools: { flexDirection: 'row', gap: 8, marginTop: 8 },
  toolButton: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 11, padding: 11, alignItems: 'center' },
  toolText: { color: theme.colors.text, fontWeight: '900', fontSize: 9 },
  codeVerify: { backgroundColor: theme.colors.selected, borderWidth: 1, borderColor: theme.colors.gold, borderRadius: theme.radius.md, padding: 13, marginTop: 12 },
  codeInput: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.gold, borderRadius: 11, color: theme.colors.goldSoft, padding: 13, fontSize: 20, fontWeight: '900', letterSpacing: 3, marginTop: 10, textAlign: 'center' },
  verifiedText: { color: theme.colors.green, fontWeight: '900', fontSize: 10, marginTop: 10, letterSpacing: .8 },
});
