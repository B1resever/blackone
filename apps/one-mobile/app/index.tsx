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
import { getDeviceLanguage, Language, supportedLanguages } from '../src/i18n';
import { theme } from '../src/theme';
import { useAuth } from '../src/auth-context';

const HERO = 'https://raw.githubusercontent.com/B1resever/blackone/main/images/hero/b1-daytime-luxury.png';

const vehicles = [
  {
    name: 'CONFORT',
    detail: 'Premium everyday rides',
    meta: '1–4 · 2 suitcases',
    image: 'https://raw.githubusercontent.com/B1resever/blackone/main/images/fleet/electric.png',
  },
  {
    name: 'XL',
    detail: 'Up to 7 passengers',
    meta: '1–7 · 6 suitcases',
    image: 'https://raw.githubusercontent.com/B1resever/blackone/main/images/fleet/Sprinter.png',
  },
  {
    name: 'SUV BLACK',
    detail: 'Luxury 2022–2026',
    meta: '1–6 · 6 suitcases',
    image: 'https://raw.githubusercontent.com/B1resever/blackone/main/images/fleet/Escalade.png',
  },
  {
    name: 'ULTRA EXCLUSIVE',
    detail: 'Chauffeur · Hourly · Executive',
    meta: 'Custom · Long Distance',
    image: 'https://raw.githubusercontent.com/B1resever/blackone/main/images/fleet/cullinan.png',
  },
] as const;

const features = [
  ['◇', 'Transparent\nPricing'],
  ['✓', 'Verified\nDrivers'],
  ['⌖', 'Live\nTracking'],
  ['▣', 'Secure\nPayments'],
  ['▤', 'In-App\nChat'],
  ['SOS', 'Emergency\nSupport'],
  ['★', 'Premium\nVehicles'],
] as const;

export default function HomeScreen() {
  const [language, setLanguage] = useState<Language>(getDeviceLanguage);
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.b1}>B1</Text>
            <Text style={styles.blackOne}>BLACK ONE</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.countryPills}>
              <View style={styles.countryPill}><Text style={styles.countryText}>🇺🇸 USA</Text></View>
              <View style={styles.countryPill}><Text style={styles.countryText}>🇦🇷 ARG</Text></View>
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
              >
                <Text style={[styles.langText, active ? styles.langTextActive : null]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <ImageBackground source={{ uri: HERO }} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>TRANSPORTE MODERNO</Text>
            <Text style={styles.headline}>
              YOUR RIDE.{'
'}
              YOUR TIME.{'
'}
              YOUR <Text style={styles.gold}>ONE.</Text>
            </Text>
            <Text style={styles.heroBody}>
              Professional rides. Transparent pricing.{'
'}
              Verified drivers. Move different.
            </Text>

            <View style={styles.heroButtons}>
              <Pressable style={styles.goldButton} onPress={() => router.push('/book')}>
                <Text style={styles.goldButtonText}>▣  BOOK A RIDE</Text>
              </Pressable>
              <Pressable style={styles.outlineButton} onPress={() => router.push('/driver')}>
                <Text style={styles.outlineButtonText}>●  DRIVE WITH ONE</Text>
              </Pressable>
            </View>

            <Text style={styles.heroMarkets}>🇺🇸  USA   |   🇦🇷  ARGENTINA</Text>
          </View>
        </ImageBackground>

        <View style={styles.bookingPanel}>
          <View style={styles.tripTabs}>
            <View style={styles.tripTabActive}><Text style={styles.tripTabActiveText}>▰  One Way</Text></View>
            <Text style={styles.tripTabText}>◴  Hourly</Text>
            <Text style={styles.tripTabText}>⇄  Round Trip</Text>
          </View>

          <View style={styles.fieldRow}>
            <Pressable style={styles.fakeField} onPress={() => router.push('/book')}>
              <Text style={styles.fieldLabel}>Pickup Location</Text>
              <Text style={styles.fieldValue}>⌖  Enter pickup location</Text>
            </Pressable>
            <Pressable style={styles.swap}><Text style={styles.swapText}>⇄</Text></Pressable>
            <Pressable style={styles.fakeField} onPress={() => router.push('/book')}>
              <Text style={styles.fieldLabel}>Drop-off Location</Text>
              <Text style={styles.fieldValue}>⌖  Enter drop-off location</Text>
            </Pressable>
          </View>

          <View style={styles.fieldRow}>
            <Pressable style={styles.smallField} onPress={() => router.push('/book')}>
              <Text style={styles.fieldLabel}>Date</Text>
              <Text style={styles.fieldValue}>▣  Select date</Text>
            </Pressable>
            <Pressable style={styles.smallField} onPress={() => router.push('/book')}>
              <Text style={styles.fieldLabel}>Time</Text>
              <Text style={styles.fieldValue}>◷  Select time</Text>
            </Pressable>
            <Pressable style={styles.smallField} onPress={() => router.push('/book')}>
              <Text style={styles.fieldLabel}>Passengers</Text>
              <Text style={styles.fieldValue}>●  1</Text>
            </Pressable>
          </View>

          <Pressable style={styles.estimate} onPress={() => router.push('/book')}>
            <Text style={styles.estimateText}>GET ESTIMATE  →</Text>
          </Pressable>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.destinationRow}>
            {['MIA Airport', 'FLL Airport', 'PortMiami', 'Port Everglades', 'Miami Beach', 'Brickell', 'Key Largo', 'Aventura'].map((item) => (
              <Pressable key={item} style={styles.destinationChip} onPress={() => router.push('/book')}>
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
            <Pressable key={vehicle.name} style={styles.vehicleCard} onPress={() => router.push('/book')}>
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
          {features.map(([icon, label]) => (
            <View key={label} style={styles.featureItem}>
              <View style={styles.featureIcon}><Text style={styles.featureIconText}>{icon}</Text></View>
              <Text style={styles.featureLabel}>{label}</Text>
            </View>
          ))}
        </ScrollView>

        <ImageBackground
          source={{ uri: 'https://raw.githubusercontent.com/B1resever/blackone/main/images/fleet/fifa-2026-transportation.png' }}
          style={styles.driverHero}
          imageStyle={styles.sectionImage}
        >
          <View style={styles.sectionOverlay} />
          <View style={styles.driverCopy}>
            <Text style={styles.kicker}>DRIVE WITH ONE</Text>
            <Text style={styles.driverTitle}>Drive more.{'
'}Keep more.</Text>
            <Text style={styles.sectionBody}>
              A simple and fair model. Greater freedom.{'
'}Be part of a premium network.
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
            <Text style={styles.feeBig}>First month free.</Text>
            <Text style={styles.zero}>10% <Text style={styles.feeSmall}>per trip from month two.</Text></Text>
          </View>
        </View>

        <Pressable style={styles.safetyBlock} onPress={() => router.push('/safety')}>
          <View style={styles.safetyPhone}>
            <Text style={styles.phoneTop}>9:41</Text>
            <View style={styles.mapMock}>
              <Text style={styles.mapCar}>◆</Text>
              <Text style={styles.mapPin}>●</Text>
            </View>
            <View style={styles.driverMini}>
              <View style={styles.driverMiniAvatar}><Text style={styles.driverMiniAvatarText}>JD</Text></View>
              <View><Text style={styles.driverMiniName}>John Doe</Text><Text style={styles.driverMiniMeta}>Cadillac Escalade 2024</Text></View>
            </View>
            <Text style={styles.rideCode}>Ride Code: 3S245</Text>
          </View>

          <View style={styles.safetyCopy}>
            <Text style={styles.kicker}>ONE SAFETY</Text>
            <Text style={styles.safetyTitle}>Know your driver.{'
'}Know your ride.</Text>
            <Text style={styles.sectionBody}>Verified drivers, live tracking, unique ride code and in-app support.</Text>
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
            <Text style={styles.marketTitle}>USA{'
'}SOUTH FLORIDA</Text>
            <Text style={styles.marketBody}>Miami-Dade and surrounding areas with premium transportation services.</Text>
            <Pressable style={styles.marketButton} onPress={() => router.push('/book')}>
              <Text style={styles.marketButtonText}>VIEW CITIES  →</Text>
            </Pressable>
          </View>

          <View style={styles.marketCard}>
            <Text style={styles.marketFlag}>🇦🇷</Text>
            <Text style={styles.marketTitle}>ARGENTINA{'
'}BUENOS AIRES</Text>
            <Text style={styles.marketBody}>CABA · Aeroparque · Ezeiza · Zona Norte · Tigre · Pilar</Text>
            <Pressable style={styles.marketButton} onPress={() => router.push('/book')}>
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
  b1: { color: theme.colors.goldSoft, fontSize: 42, lineHeight: 38, fontWeight: '900', fontStyle: 'italic', letterSpacing: -3 },
  blackOne: { color: theme.colors.white, fontSize: 10, fontWeight: '900', letterSpacing: 4, marginTop: 4 },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  countryPills: { flexDirection: 'row', gap: 6 },
  countryPill: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: '#060C10' },
  countryText: { color: theme.colors.white, fontSize: 9, fontWeight: '800' },
  accountPill: { borderWidth: 1, borderColor: theme.colors.gold, borderRadius: theme.radius.pill, paddingHorizontal: 11, paddingVertical: 7 },
  accountText: { color: theme.colors.goldSoft, fontSize: 9, fontWeight: '900', letterSpacing: .5 },
  languageRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 18, paddingBottom: 10 },
  lang: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  langActive: { backgroundColor: theme.colors.gold, borderColor: theme.colors.gold },
  langText: { color: theme.colors.muted, fontSize: 9, fontWeight: '900' },
  langTextActive: { color: '#16100A' },
  hero: { height: 410, marginHorizontal: 12, borderRadius: 22, overflow: 'hidden', justifyContent: 'flex-end' },
  heroImage: { borderRadius: 22 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,4,7,.48)' },
  heroCopy: { padding: 20 },
  kicker: { color: theme.colors.gold, fontSize: 11, fontWeight: '900', letterSpacing: 2.5, marginBottom: 8 },
  headline: { color: theme.colors.white, fontSize: 42, lineHeight: 39, fontWeight: '900', letterSpacing: -1.8 },
  gold: { color: theme.colors.goldSoft },
  heroBody: { color: '#F2F0EB', fontSize: 14, lineHeight: 20, marginTop: 12, fontWeight: '600' },
  heroButtons: { flexDirection: 'row', gap: 9, marginTop: 18 },
  goldButton: { flex: 1, backgroundColor: theme.colors.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  goldButtonCompact: { alignSelf: 'flex-start', backgroundColor: theme.colors.gold, borderRadius: 12, paddingHorizontal: 17, paddingVertical: 13, marginTop: 17 },
  goldButtonText: { color: '#16100A', fontWeight: '900', fontSize: 11 },
  outlineButton: { flex: 1, borderWidth: 1, borderColor: '#D8D3CA', borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(2,6,9,.35)' },
  outlineButtonText: { color: theme.colors.white, fontWeight: '900', fontSize: 10 },
  heroMarkets: { color: theme.colors.white, fontSize: 11, fontWeight: '900', marginTop: 16, letterSpacing: .5 },
  bookingPanel: { margin: 12, marginTop: 14, padding: 14, backgroundColor: '#050B0F', borderWidth: 1, borderColor: '#394147', borderRadius: 18 },
  tripTabs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  tripTabActive: { backgroundColor: theme.colors.gold, borderRadius: 10, paddingHorizontal: 15, paddingVertical: 10 },
  tripTabActiveText: { color: '#16100A', fontWeight: '900', fontSize: 11 },
  tripTabText: { color: theme.colors.white, fontSize: 10, fontWeight: '800', paddingHorizontal: 5 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  fakeField: { flex: 1, backgroundColor: '#0B1318', borderWidth: 1, borderColor: '#2B3439', borderRadius: 11, padding: 11 },
  smallField: { flex: 1, backgroundColor: '#0B1318', borderWidth: 1, borderColor: '#2B3439', borderRadius: 11, padding: 10 },
  fieldLabel: { color: theme.colors.muted, fontSize: 9, fontWeight: '700', marginBottom: 5 },
  fieldValue: { color: theme.colors.white, fontSize: 10, fontWeight: '700' },
  swap: { width: 31, height: 31, borderRadius: 9, backgroundColor: '#111A1F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#313A40' },
  swapText: { color: theme.colors.white, fontSize: 16 },
  estimate: { marginTop: 10, backgroundColor: theme.colors.gold, borderRadius: 11, paddingVertical: 14, alignItems: 'center' },
  estimateText: { color: '#16100A', fontWeight: '900', fontSize: 12 },
  destinationRow: { gap: 7, paddingTop: 12 },
  destinationChip: { borderWidth: 1, borderColor: '#293239', borderRadius: theme.radius.pill, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#081015' },
  destinationText: { color: theme.colors.white, fontSize: 9, fontWeight: '700' },
  vehicleRail: { paddingHorizontal: 12, gap: 10, paddingBottom: 14 },
  vehicleCard: { width: 242, height: 205, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#30383D', backgroundColor: '#05090C' },
  vehicleImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  vehicleShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,.30)' },
  vehicleCopy: { position: 'absolute', left: 14, right: 46, bottom: 14 },
  vehicleName: { color: theme.colors.white, fontSize: 17, fontWeight: '900' },
  vehicleDetail: { color: '#E1E1DE', fontSize: 11, marginTop: 3 },
  vehicleMeta: { color: theme.colors.goldSoft, fontSize: 10, fontWeight: '800', marginTop: 8 },
  vehicleArrow: { position: 'absolute', right: 13, bottom: 13, width: 34, height: 34, borderRadius: 18, borderWidth: 1, borderColor: '#D2D2CE', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,6,9,.55)' },
  vehicleArrowText: { color: theme.colors.white, fontSize: 24, marginTop: -2 },
  featureRail: { paddingHorizontal: 12, paddingVertical: 15, gap: 22, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#252D32' },
  featureItem: { width: 74, alignItems: 'center' },
  featureIcon: { width: 38, height: 38, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.gold, alignItems: 'center', justifyContent: 'center' },
  featureIconText: { color: theme.colors.goldSoft, fontSize: 12, fontWeight: '900' },
  featureLabel: { color: theme.colors.white, fontSize: 9, lineHeight: 12, textAlign: 'center', marginTop: 7, fontWeight: '700' },
  driverHero: { height: 270, marginHorizontal: 12, marginTop: 14, borderRadius: 20, overflow: 'hidden', justifyContent: 'center' },
  sectionImage: { borderRadius: 20 },
  sectionOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,4,7,.55)' },
  driverCopy: { padding: 20 },
  driverTitle: { color: theme.colors.white, fontSize: 34, lineHeight: 33, fontWeight: '900' },
  sectionBody: { color: '#E4E3DE', fontSize: 12, lineHeight: 18, marginTop: 10 },
  feeGrid: { flexDirection: 'row', gap: 10, padding: 12 },
  feeCard: { flex: 1, minHeight: 150, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: '#2D3438', borderRadius: 17, padding: 14 },
  cardKicker: { color: theme.colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  feeBig: { color: theme.colors.goldSoft, fontSize: 24, fontWeight: '900', marginTop: 10 },
  feeSmall: { color: theme.colors.white, fontSize: 10, fontWeight: '700' },
  cardBody: { color: theme.colors.muted, fontSize: 10, lineHeight: 15, marginTop: 7 },
  zero: { color: theme.colors.white, fontWeight: '900', fontSize: 18, marginTop: 13 },
  safetyBlock: { margin: 12, marginTop: 3, padding: 16, borderRadius: 22, backgroundColor: '#050B0F', borderWidth: 1, borderColor: '#293136', flexDirection: 'row', gap: 14 },
  safetyPhone: { width: 122, borderWidth: 2, borderColor: '#3A4247', borderRadius: 24, backgroundColor: '#071015', padding: 8 },
  phoneTop: { color: theme.colors.white, fontSize: 8, textAlign: 'center', marginBottom: 6 },
  mapMock: { height: 105, borderRadius: 15, backgroundColor: '#0B171E', borderWidth: 1, borderColor: '#1E2D35', alignItems: 'center', justifyContent: 'center' },
  mapCar: { color: theme.colors.white, fontSize: 18, transform: [{ rotate: '25deg' }] },
  mapPin: { color: '#24C76A', fontSize: 20, marginTop: 4 },
  driverMini: { flexDirection: 'row', gap: 7, marginTop: 8, alignItems: 'center' },
  driverMiniAvatar: { width: 25, height: 25, borderRadius: 13, backgroundColor: '#B98F50', alignItems: 'center', justifyContent: 'center' },
  driverMiniAvatarText: { color: '#140F09', fontSize: 8, fontWeight: '900' },
  driverMiniName: { color: theme.colors.white, fontSize: 9, fontWeight: '900' },
  driverMiniMeta: { color: theme.colors.muted, fontSize: 7, marginTop: 2 },
  rideCode: { backgroundColor: '#124B28', color: '#DDFBE7', fontSize: 7, padding: 4, marginTop: 7, borderRadius: 5 },
  safetyCopy: { flex: 1 },
  safetyTitle: { color: theme.colors.white, fontSize: 26, lineHeight: 27, fontWeight: '900' },
  safetyRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 },
  safetyIcon: { width: 31, height: 31, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.gold, alignItems: 'center', justifyContent: 'center' },
  safetyIconText: { color: theme.colors.goldSoft, fontSize: 9, fontWeight: '900' },
  safetyRowText: { color: theme.colors.white, fontSize: 10, fontWeight: '800', flex: 1 },
  marketGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingTop: 4 },
  marketCard: { flex: 1, minHeight: 210, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: '#2B3439', borderRadius: 18, padding: 15 },
  marketFlag: { fontSize: 25 },
  marketTitle: { color: theme.colors.white, fontSize: 18, lineHeight: 19, fontWeight: '900', marginTop: 9 },
  marketBody: { color: theme.colors.muted, fontSize: 10, lineHeight: 15, marginTop: 9 },
  marketButton: { borderWidth: 1, borderColor: theme.colors.gold, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 'auto' },
  marketButtonText: { color: theme.colors.white, fontSize: 9, fontWeight: '900' },
  trackReservation: { marginHorizontal: 12, marginTop: 14, borderWidth: 1, borderColor: theme.colors.gold, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  trackReservationText: { color: theme.colors.goldSoft, fontSize: 10, fontWeight: '900', letterSpacing: .5 },
  legalButton: { alignItems: 'center', paddingVertical: 18 },
  legalText: { color: theme.colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
});
