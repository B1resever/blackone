import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDeviceLanguage, Language, supportedLanguages, t } from '../src/i18n';
import { theme } from '../src/theme';
import { useReservation } from '../src/reservation-context';
import { BrandMark } from '../src/brand-mark';
import { RideType, ReservationDraft } from '../src/reservation';
import { useAuth } from '../src/auth-context';

const HERO = 'https://raw.githubusercontent.com/B1resever/blackone/main/images/hero/b1-daytime-luxury.png';

const vehicles = [
  {
    id: 'confort',
    name: 'CONFORT',
    detail: 'Premium everyday rides',
    meta: '1–4 · 2 suitcases',
    image: 'https://raw.githubusercontent.com/B1resever/blackone/main/images/fleet/electric.png',
  },
  {
    id: 'xl',
    name: 'XL',
    detail: 'Up to 7 passengers',
    meta: '1–7 · 6 suitcases',
    image: 'https://raw.githubusercontent.com/B1resever/blackone/main/images/fleet/Sprinter.png',
  },
  {
    id: 'suv-black',
    name: 'SUV BLACK',
    detail: 'Luxury 2022–2026',
    meta: '1–6 · 6 suitcases',
    image: 'https://raw.githubusercontent.com/B1resever/blackone/main/images/fleet/Escalade.png',
  },
  {
    id: 'ultra-exclusive',
    name: 'ULTRA EXCLUSIVE',
    detail: 'Chauffeur · Hourly · Executive',
    meta: 'Custom · Long Distance',
    image: 'https://raw.githubusercontent.com/B1resever/blackone/main/images/fleet/cullinan.png',
  },
] as const;

const features = [
  { icon: '◇', label: 'Transparent\nPricing', route: '/book' },
  { icon: '✓', label: 'Verified\nDrivers', route: '/safety' },
  { icon: '⌖', label: 'Live\nTracking', route: '/trips' },
  { icon: '▣', label: 'Secure\nPayments', route: '/book' },
  { icon: '▤', label: 'In-App\nChat', route: '/trips' },
  { icon: 'SOS', label: 'Emergency\nSupport', route: '/trip-support' },
  { icon: '★', label: 'Premium\nVehicles', route: '/book' },
] as const;

export default function HomeScreen() {
  const [language, setLanguage] = useState<Language>(getDeviceLanguage);
  const { user } = useAuth();
  const { draft, updateDraft } = useReservation();
  const copy = (key: Parameters<typeof t>[1]) => t(language, key);
  const chooseMarket = (marketId: ReservationDraft['marketId']) => {
    updateDraft(draft.marketId === marketId ? { marketId } : { marketId, pickup: '', dropoff: '' });
    router.push('/book');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BrandMark />

          <View style={styles.headerRight}>
            <View style={styles.countryPills}>
              <Pressable style={styles.countryPill} onPress={() => chooseMarket('south-florida')} accessibilityRole="button"><Text style={styles.countryText}>🇺🇸 USA</Text></Pressable>
              <Pressable style={styles.countryPill} onPress={() => chooseMarket('buenos-aires')} accessibilityRole="button"><Text style={styles.countryText}>🇦🇷 ARG</Text></Pressable>
            </View>

            <Pressable style={styles.accountPill} onPress={() => router.push('/account')}>
              <Text style={styles.accountText}>{user ? 'MY ONE' : 'SIGN IN'}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.languageRow}>
          {supportedLanguages.map((item) => {
            const active = item.code === language;
            return (
              <Pressable
                key={item.code}
                style={[styles.lang, active ? styles.langActive : null]}
                onPress={() => setLanguage(item.code)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.langText, active ? styles.langTextActive : null]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={() => router.push('/experiences')} accessibilityRole="button" style={{ backgroundColor: '#F3FAFF', padding: 18, borderRadius: 15, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: '#BBDCF1' }}>
          <Text style={{ color: '#0C3555', fontSize: 18, fontWeight: '800' }}>Explore B1 · Cars / Jets / Boats →</Text>
          <Text style={{ color: '#416C87', marginTop: 5, fontSize: 12 }}>Choose your premium mobility service</Text>
        </Pressable>

        <ImageBackground source={{ uri: HERO }} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroCopy}>
            <Text style={[styles.kicker, styles.imageAccent]}>{copy('modernTransport')}</Text>
            <Text style={styles.headline}>
              {copy('hero1')}{'\n'}
              {copy('hero2')}{'\n'}
              <Text style={styles.gold}>{copy('hero3')}</Text>
            </Text>
            <Text style={styles.heroBody}>
              {copy('heroBody')}
            </Text>

            <View style={styles.heroButtons}>
              <Pressable style={styles.goldButton} onPress={() => router.push('/book')}>
                <Text style={styles.goldButtonText}>▣  {copy('bookRide')}</Text>
              </Pressable>
              <Pressable style={styles.outlineButton} onPress={() => router.push('/driver')}>
                <Text style={styles.outlineButtonText}>●  {copy('driveWithOne')}</Text>
              </Pressable>
            </View>

            <Text style={styles.heroMarkets}>🇺🇸  USA   |   🇦🇷  ARGENTINA</Text>
          </View>
        </ImageBackground>

        <View style={styles.bookingPanel}>
          <View style={styles.tripTabs}>
            {(['one-way', 'hourly', 'round-trip'] as RideType[]).map((id) => (
              <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: draft.rideType === id }}
                style={[styles.tripTab, draft.rideType === id && styles.tripTabActive]}
                onPress={() => updateDraft({ rideType: id })}>
                <Text style={[styles.tripTabText, draft.rideType === id && styles.tripTabActiveText]}>
                  {copy(id === 'one-way' ? 'oneWay' : id === 'hourly' ? 'hourly' : 'roundTrip')}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.fieldRow}>
            <Pressable style={styles.locationField} onPress={() => router.push('/book')}>
              <Text style={styles.fieldLabel}>{copy('pickup')}</Text>
              <Text style={styles.fieldValue}>⌖  {draft.pickup || copy('pickupPlaceholder')}</Text>
            </Pressable>
            {draft.rideType !== 'hourly' ? <>
            <Pressable style={[styles.swap, !(draft.pickup || draft.dropoff) && styles.disabled]}
              accessibilityRole="button" accessibilityLabel={`${copy('pickup')} ⇄ ${copy('dropoff')}`}
              disabled={!(draft.pickup || draft.dropoff)}
              onPress={() => updateDraft({ pickup: draft.dropoff, dropoff: draft.pickup })}><Text style={styles.swapText}>⇄</Text></Pressable>
            <Pressable style={styles.locationField} onPress={() => router.push('/book')}>
              <Text style={styles.fieldLabel}>{copy('dropoff')}</Text>
              <Text style={styles.fieldValue}>⌖  {draft.dropoff || copy('dropoffPlaceholder')}</Text>
            </Pressable>
            </> : null}
          </View>

          <View style={styles.fieldRow}>
            <Pressable style={styles.smallField} onPress={() => router.push('/book')}>
              <Text style={styles.fieldLabel}>Date</Text>
              <Text style={styles.fieldValue}>▣  {draft.pickupDate || 'Select date'}</Text>
            </Pressable>
            <Pressable style={styles.smallField} onPress={() => router.push('/book')}>
              <Text style={styles.fieldLabel}>Time</Text>
              <Text style={styles.fieldValue}>◷  {draft.pickupTime || 'Select time'}</Text>
            </Pressable>
            <Pressable style={styles.smallField} onPress={() => router.push('/book')}>
              <Text style={styles.fieldLabel}>Passengers</Text>
              <Text style={styles.fieldValue}>●  {draft.passengers}</Text>
            </Pressable>
          </View>

          <Pressable style={styles.estimate} onPress={() => router.push('/book')}>
            <Text style={styles.estimateText}>{copy('estimate')}  →</Text>
          </Pressable>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destinationRow}>
            {(draft.marketId === 'south-florida' ? ['MIA Airport', 'FLL Airport', 'PortMiami', 'Port Everglades', 'Miami Beach', 'Brickell', 'Key Largo', 'Aventura'] : ['Ezeiza Airport', 'Aeroparque', 'Recoleta', 'Palermo', 'Tigre', 'Pilar']).map((item) => (
              <Pressable key={item} style={styles.destinationChip} accessibilityRole="button" onPress={() => { updateDraft({ dropoff: item, rideType: draft.rideType === 'hourly' ? 'one-way' : draft.rideType }); router.push('/book'); }}>
                <Text style={styles.destinationText}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vehicleRail}
        >
          {vehicles.map((vehicle) => (
            <Pressable key={vehicle.name} style={styles.vehicleCard} accessibilityRole="button" onPress={() => { updateDraft({ vehicleClass: vehicle.id }); router.push('/book'); }}>
              <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
              <View style={styles.vehicleShade} />
              <View style={styles.vehicleCopy}>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                <Text style={styles.vehicleDetail}>{vehicle.detail}</Text>
                <Text style={styles.vehicleMeta}>{vehicle.meta}</Text>
              </View>
              <View style={styles.vehicleArrow}><Text style={styles.vehicleArrowText}>›</Text></View>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featureRail}>
          {features.map((feature) => (
            <Pressable key={feature.label} style={styles.featureItem} onPress={() => router.push(feature.route)}>
              <View style={styles.featureIcon}><Text style={styles.featureIconText}>{feature.icon}</Text></View>
              <Text style={styles.featureLabel}>{feature.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <ImageBackground
          source={{ uri: 'https://raw.githubusercontent.com/B1resever/blackone/main/images/fleet/fifa-2026-transportation.png' }}
          style={styles.driverHero}
          imageStyle={styles.sectionImage}
        >
          <View style={styles.sectionOverlay} />
          <View style={styles.driverCopy}>
            <Text style={[styles.kicker, styles.imageAccent]}>{copy('driveWithOne')}</Text>
            <Text style={styles.driverTitle}>Drive more.{'\n'}Keep more.</Text>
            <Text style={[styles.sectionBody, styles.onImage]}>
              A simple and fair model. Greater freedom.{'\n'}Be part of a premium network.
            </Text>
            <Pressable style={styles.goldButtonCompact} onPress={() => router.push('/driver')}>
              <Text style={styles.goldButtonText}>JOIN AS A DRIVER  →</Text>
            </Pressable>
          </View>
        </ImageBackground>

        <View style={styles.feeGrid}>
          <View style={styles.feeCard}>
            <Text style={styles.cardKicker}>B1 DRIVER MODEL (USA)</Text>
            <Text style={styles.feeBig}>$25 <Text style={styles.feeSmall}>/ month</Text></Text>
            <Text style={styles.cardBody}>or 5% per trip until you reach $25.</Text>
            <Text style={styles.zero}>$0 <Text style={styles.feeSmall}>platform fee after that.</Text></Text>
          </View>
          <View style={styles.feeCard}>
            <Text style={styles.cardKicker}>ARGENTINA LAUNCH</Text>
            <Text style={styles.feeBig}>First-month membership free.</Text>
            <Text style={styles.zero}>10% <Text style={styles.feeSmall}>per trip from day one.</Text></Text>
          </View>
        </View>

        <Pressable style={styles.safetyBlock} onPress={() => router.push('/safety')}>
          <View style={styles.safetyCopy}>
            <Text style={styles.kicker}>{copy('safety')}</Text>
            <Text style={styles.safetyTitle}>{copy('safetyTitle')}</Text>
            <Text style={styles.sectionBody}>{copy('safetyBody')}</Text>
            {[
              ['⌖', 'Real-Time Tracking'],
              ['▣', 'Ride Code'],
              ['▤', 'Secure Chat'],
              ['SOS', 'Emergency Support'],
            ].map(([icon, label]) => (
              <View key={label} style={styles.safetyRow}>
                <View style={styles.safetyIcon}><Text style={styles.safetyIconText}>{icon}</Text></View>
                <Text style={styles.safetyRowText}>{label}</Text>
              </View>
            ))}
          </View>
        </Pressable>

        <View style={styles.marketGrid}>
          <View style={styles.marketCard}>
            <Text style={styles.marketFlag}>🇺🇸</Text>
            <Text style={styles.marketTitle}>USA{'\n'}SOUTH FLORIDA</Text>
            <Text style={styles.marketBody}>Miami-Dade and surrounding areas with premium transportation services.</Text>
            <Pressable style={styles.marketButton} onPress={() => chooseMarket('south-florida')}>
              <Text style={styles.marketButtonText}>VIEW CITIES  →</Text>
            </Pressable>
          </View>

          <View style={styles.marketCard}>
            <Text style={styles.marketFlag}>🇦🇷</Text>
            <Text style={styles.marketTitle}>ARGENTINA{'\n'}BUENOS AIRES</Text>
            <Text style={styles.marketBody}>CABA · Aeroparque · Ezeiza · Zona Norte · Tigre · Pilar</Text>
            <Pressable style={styles.marketButton} onPress={() => chooseMarket('buenos-aires')}>
              <Text style={styles.marketButtonText}>VER CIUDADES  →</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.trackReservation} onPress={() => router.push('/status')}>
          <Text style={styles.trackReservationText}>MY RESERVATION · TRACK STATUS →</Text>
        </Pressable>

        <Pressable style={styles.legalButton} onPress={() => router.push('/legal')}>
          <Text style={styles.legalText}>SUPPORT · PRIVACY · TERMS</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingBottom: 32 },
  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  imageAccent: { color: theme.colors.accent },
  onImage: { color: theme.colors.onImage },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  countryPills: { flexDirection: 'row', gap: 6 },
  countryPill: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: theme.colors.surface },
  countryText: { color: theme.colors.text, fontSize: 9, fontWeight: '800' },
  accountPill: { borderWidth: 1, borderColor: theme.colors.gold, borderRadius: theme.radius.pill, paddingHorizontal: 11, paddingVertical: 7 },
  accountText: { color: theme.colors.goldSoft, fontSize: 9, fontWeight: '900', letterSpacing: .5 },
  languageRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 18, paddingBottom: 10 },
  lang: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  langActive: { backgroundColor: theme.colors.gold, borderColor: theme.colors.gold },
  langText: { color: theme.colors.muted, fontSize: 9, fontWeight: '900' },
  langTextActive: { color: theme.colors.onAccent },
  hero: { height: 410, marginHorizontal: 12, borderRadius: 22, overflow: 'hidden', justifyContent: 'flex-end' },
  heroImage: { borderRadius: 22 },
  heroOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,4,7,.48)' },
  heroCopy: { padding: 20 },
  kicker: { color: theme.colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 2.5, marginBottom: 8 },
  headline: { color: theme.colors.onImage, fontSize: 42, lineHeight: 39, fontWeight: '900', letterSpacing: -1.8 },
  gold: { color: theme.colors.accent },
  heroBody: { color: theme.colors.onImage, fontSize: 14, lineHeight: 20, marginTop: 12, fontWeight: '600' },
  heroButtons: { flexDirection: 'row', gap: 9, marginTop: 18 },
  goldButton: { flex: 1, backgroundColor: theme.colors.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  goldButtonCompact: { alignSelf: 'flex-start', backgroundColor: theme.colors.gold, borderRadius: 12, paddingHorizontal: 17, paddingVertical: 13, marginTop: 17 },
  goldButtonText: { color: theme.colors.onAccent, fontWeight: '900', fontSize: 11 },
  outlineButton: { flex: 1, borderWidth: 1, borderColor: '#D8D3CA', borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(2,6,9,.35)' },
  outlineButtonText: { color: theme.colors.onImage, fontWeight: '900', fontSize: 10 },
  heroMarkets: { color: theme.colors.onImage, fontSize: 11, fontWeight: '900', marginTop: 16, letterSpacing: .5 },
  bookingPanel: { margin: 12, marginTop: 14, padding: 14, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18 },
  tripTabs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  tripTab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.4 },
  tripTabActive: { backgroundColor: theme.colors.gold, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10 },
  tripTabActiveText: { color: theme.colors.onAccent, fontWeight: '900', fontSize: 11 },
  tripTabText: { color: theme.colors.text, fontSize: 10, fontWeight: '800', paddingHorizontal: 5 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  locationField: { flex: 1, backgroundColor: theme.colors.surfaceRaised, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 11, padding: 11 },
  smallField: { flex: 1, backgroundColor: theme.colors.surfaceRaised, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 11, padding: 10 },
  fieldLabel: { color: theme.colors.muted, fontSize: 9, fontWeight: '700', marginBottom: 5 },
  fieldValue: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  swap: { width: 44, height: 44, borderRadius: 9, backgroundColor: theme.colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  swapText: { color: theme.colors.text, fontSize: 16 },
  estimate: { marginTop: 10, backgroundColor: theme.colors.gold, borderRadius: 11, paddingVertical: 14, alignItems: 'center' },
  estimateText: { color: theme.colors.onAccent, fontWeight: '900', fontSize: 12 },
  destinationRow: { gap: 7, paddingTop: 12 },
  destinationChip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.surfaceRaised },
  destinationText: { color: theme.colors.text, fontSize: 9, fontWeight: '700' },
  vehicleRail: { paddingHorizontal: 12, gap: 10, paddingBottom: 14 },
  vehicleCard: { width: 242, height: 205, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  vehicleImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  vehicleShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,.30)' },
  vehicleCopy: { position: 'absolute', left: 14, right: 46, bottom: 14 },
  vehicleName: { color: theme.colors.onImage, fontSize: 17, fontWeight: '900' },
  vehicleDetail: { color: theme.colors.onImage, fontSize: 11, marginTop: 3 },
  vehicleMeta: { color: theme.colors.accent, fontSize: 10, fontWeight: '800', marginTop: 8 },
  vehicleArrow: { position: 'absolute', right: 13, bottom: 13, width: 34, height: 34, borderRadius: 18, borderWidth: 1, borderColor: '#D2D2CE', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,6,9,.55)' },
  vehicleArrowText: { color: theme.colors.onImage, fontSize: 24, marginTop: -2 },
  featureRail: { paddingHorizontal: 12, paddingVertical: 15, gap: 22, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.border },
  featureItem: { width: 74, alignItems: 'center' },
  featureIcon: { width: 38, height: 38, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.gold, alignItems: 'center', justifyContent: 'center' },
  featureIconText: { color: theme.colors.goldSoft, fontSize: 12, fontWeight: '900' },
  featureLabel: { color: theme.colors.text, fontSize: 9, lineHeight: 12, textAlign: 'center', marginTop: 7, fontWeight: '700' },
  driverHero: { height: 270, marginHorizontal: 12, marginTop: 14, borderRadius: 20, overflow: 'hidden', justifyContent: 'center' },
  sectionImage: { borderRadius: 20 },
  sectionOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,4,7,.55)' },
  driverCopy: { padding: 20 },
  driverTitle: { color: theme.colors.onImage, fontSize: 34, lineHeight: 33, fontWeight: '900' },
  sectionBody: { color: theme.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  feeGrid: { flexDirection: 'row', gap: 10, padding: 12 },
  feeCard: { flex: 1, minHeight: 150, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 17, padding: 14 },
  cardKicker: { color: theme.colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  feeBig: { color: theme.colors.goldSoft, fontSize: 24, fontWeight: '900', marginTop: 10 },
  feeSmall: { color: theme.colors.text, fontSize: 10, fontWeight: '700' },
  cardBody: { color: theme.colors.muted, fontSize: 10, lineHeight: 15, marginTop: 7 },
  zero: { color: theme.colors.text, fontWeight: '900', fontSize: 18, marginTop: 13 },
  safetyBlock: { margin: 12, marginTop: 3, padding: 16, borderRadius: 22, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', gap: 14 },
  safetyCopy: { flex: 1 },
  safetyTitle: { color: theme.colors.text, fontSize: 26, lineHeight: 27, fontWeight: '900' },
  safetyRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 },
  safetyIcon: { width: 31, height: 31, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.gold, alignItems: 'center', justifyContent: 'center' },
  safetyIconText: { color: theme.colors.goldSoft, fontSize: 9, fontWeight: '900' },
  safetyRowText: { color: theme.colors.text, fontSize: 10, fontWeight: '800', flex: 1 },
  marketGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingTop: 4 },
  marketCard: { flex: 1, minHeight: 210, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18, padding: 15 },
  marketFlag: { fontSize: 25 },
  marketTitle: { color: theme.colors.text, fontSize: 18, lineHeight: 19, fontWeight: '900', marginTop: 9 },
  marketBody: { color: theme.colors.muted, fontSize: 10, lineHeight: 15, marginTop: 9 },
  marketButton: { borderWidth: 1, borderColor: theme.colors.gold, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 'auto' },
  marketButtonText: { color: theme.colors.text, fontSize: 9, fontWeight: '900' },
  trackReservation: { marginHorizontal: 12, marginTop: 14, borderWidth: 1, borderColor: theme.colors.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  trackReservationText: { color: theme.colors.goldSoft, fontSize: 10, fontWeight: '900', letterSpacing: .5 },
  legalButton: { alignItems: 'center', paddingVertical: 18 },
  legalText: { color: theme.colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
});
