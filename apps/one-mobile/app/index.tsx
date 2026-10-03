import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDeviceLanguage, Language, supportedLanguages, t } from '../src/i18n';
import { serviceMarkets } from '../src/markets';
import { theme } from '../src/theme';
import { useAuth } from '../src/auth-context';

const categories = [
  { name: 'CONFORT', detail: 'Premium everyday rides', meta: '1–4' },
  { name: 'XL', detail: 'Up to 7 passengers', meta: '1–7' },
  { name: 'SUV BLACK', detail: 'Luxury 2022–2026', meta: '1–6' },
  { name: 'ULTRA EXCLUSIVE', detail: 'Chauffeur · Hourly · Executive', meta: 'Custom' },
];

type LanguageSelectorProps = {
  language: Language;
  onChange: (language: Language) => void;
};

function LanguageSelector({ language, onChange }: LanguageSelectorProps) {
  return (
    <View style={styles.languageRow} accessibilityLabel={t(language, 'language')}>
      {supportedLanguages.map((item) => {
        const active = item.code === language;
        return (
          <Pressable
            key={item.code}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.languagePill, active ? styles.languagePillActive : null]}
            onPress={() => onChange(item.code)}
          >
            <Text style={[styles.languageText, active ? styles.languageTextActive : null]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function HomeScreen() {
  const [language, setLanguage] = useState<Language>(getDeviceLanguage);
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brand}>B1</Text>
            <Text style={styles.brandSub}>BLACK ONE</Text>
          </View>
          <Pressable style={styles.marketPill} onPress={() => router.push('/account')}>
            <Text style={styles.marketText}>{user ? 'MY ONE' : 'SIGN IN'}</Text>
          </Pressable>
        </View>

        <LanguageSelector language={language} onChange={setLanguage} />

        <View style={styles.hero}>
          <Text style={styles.kicker}>{t(language, 'modernTransport')}</Text>
          <Text style={styles.headline}>
            {t(language, 'hero1')}{'\n'}
            {t(language, 'hero2')}{'\n'}
            <Text style={styles.cyan}>{t(language, 'hero3')}</Text>
          </Text>
          <Text style={styles.body}>{t(language, 'heroBody')}</Text>

          <View style={styles.actions}>
            <Pressable style={styles.primaryButton} onPress={() => router.push('/book')}>
              <Text style={styles.primaryButtonText}>{t(language, 'bookRide')} →</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => router.push('/driver')}>
              <Text style={styles.secondaryButtonText}>{t(language, 'driveWithOne')}</Text>
            </Pressable>
          </View>
          <Pressable style={styles.trackButton} onPress={() => router.push('/status')}>
            <Text style={styles.trackButtonText}>MY RESERVATION · TRACK STATUS →</Text>
          </Pressable>
        </View>

        <View style={styles.globalCard}>
          <Text style={styles.globalTitle}>🌎 {t(language, 'globalAccess')}</Text>
          <Text style={styles.globalText}>{t(language, 'serviceAreas')}</Text>
        </View>

        <View style={styles.bookingCard}>
          <View style={styles.segmentRow}>
            <View style={styles.segmentActive}><Text style={styles.segmentActiveText}>{t(language, 'oneWay')}</Text></View>
            <Text style={styles.segmentText}>{t(language, 'hourly')}</Text>
            <Text style={styles.segmentText}>{t(language, 'roundTrip')}</Text>
          </View>
          <Text style={styles.fieldLabel}>{t(language, 'pickup')}</Text>
          <View style={styles.field}><Text style={styles.fieldText}>{t(language, 'pickupPlaceholder')}</Text></View>
          <Text style={styles.fieldLabel}>{t(language, 'dropoff')}</Text>
          <View style={styles.field}><Text style={styles.fieldText}>{t(language, 'dropoffPlaceholder')}</Text></View>
          <Pressable style={styles.estimateButton} onPress={() => router.push('/book')}>
            <Text style={styles.estimateButtonText}>{t(language, 'estimate')} →</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>{t(language, 'choose')}</Text>
        <View style={styles.grid}>
          {categories.map((item) => (
            <Pressable key={item.name} style={styles.vehicleCard} onPress={() => router.push('/book')}>
              <View style={styles.vehicleGlow} />
              <Text style={styles.vehicleName}>{item.name}</Text>
              <Text style={styles.vehicleDetail}>{item.detail}</Text>
              <Text style={styles.vehicleMeta}>{item.meta}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.marketsCard}>
          <Text style={styles.kicker}>{t(language, 'markets')}</Text>
          {serviceMarkets.map((market) => (
            <View key={market.id} style={styles.marketRow}>
              <View style={styles.marketCopy}>
                <Text style={styles.marketName}>
                  {market.countryCode === 'US' ? '🇺🇸' : '🇦🇷'}{' '}
                  {market.id === 'south-florida' ? t(language, 'marketMiami') : t(language, 'marketBuenosAires')}
                </Text>
                <Text style={styles.marketAreas}>{market.areas.join(' · ')}</Text>
              </View>
              <Text style={styles.marketStatus}>{t(language, 'marketStatusLive')}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.safetyCard} onPress={() => router.push('/safety')}>
          <Text style={styles.kicker}>{t(language, 'safety')}</Text>
          <Text style={styles.sectionHero}>{t(language, 'safetyTitle')}</Text>
          <Text style={styles.body}>{t(language, 'safetyBody')}</Text>
          <Text style={styles.linkText}>{t(language, 'exploreSafety')} →</Text>
        </Pressable>

        <Pressable style={styles.legalButton} onPress={() => router.push('/legal')}>
          <Text style={styles.legalText}>HELP · PRIVACY · TERMS →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 48 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  brand: { color: theme.colors.cyanSoft, fontSize: 36, fontWeight: '900', letterSpacing: -2 },
  brandSub: { color: theme.colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 4, marginTop: -4 },
  marketPill: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: theme.colors.surface },
  marketText: { color: theme.colors.white, fontSize: 12, fontWeight: '700' },
  languageRow: { flexDirection: 'row', gap: 7, marginBottom: 22 },
  languagePill: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.pill, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: theme.colors.surface },
  languagePillActive: { backgroundColor: theme.colors.cyan, borderColor: theme.colors.cyan },
  languageText: { color: theme.colors.muted, fontWeight: '900', fontSize: 11 },
  languageTextActive: { color: '#001217' },
  hero: { paddingVertical: 8, marginBottom: 18 },
  kicker: { color: theme.colors.cyan, fontSize: 12, fontWeight: '800', letterSpacing: 2.3, marginBottom: 10 },
  headline: { color: theme.colors.white, fontSize: 43, lineHeight: 42, fontWeight: '900', letterSpacing: -1.8 },
  cyan: { color: theme.colors.cyan },
  body: { color: theme.colors.muted, fontSize: 15, lineHeight: 22, marginTop: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  primaryButton: { flex: 1, backgroundColor: theme.colors.cyan, borderRadius: theme.radius.md, paddingVertical: 15, alignItems: 'center' },
  primaryButtonText: { color: '#001217', fontWeight: '900', fontSize: 12 },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: '#587181', borderRadius: theme.radius.md, paddingVertical: 15, alignItems: 'center' },
  secondaryButtonText: { color: theme.colors.white, fontWeight: '800', fontSize: 11 },
  trackButton: { marginTop: 10, alignItems: 'center', paddingVertical: 10 },
  trackButtonText: { color: theme.colors.cyanSoft, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  globalCard: { backgroundColor: '#04202A', borderWidth: 1, borderColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 14, marginBottom: 18 },
  globalTitle: { color: theme.colors.white, fontWeight: '900', fontSize: 14 },
  globalText: { color: theme.colors.cyanSoft, marginTop: 5, fontSize: 12 },
  bookingCard: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 16, marginBottom: 28 },
  segmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  segmentActive: { backgroundColor: theme.colors.cyan, paddingHorizontal: 16, paddingVertical: 9, borderRadius: theme.radius.pill },
  segmentActiveText: { color: '#001217', fontWeight: '900', fontSize: 12 },
  segmentText: { color: theme.colors.muted, fontWeight: '700', fontSize: 12 },
  fieldLabel: { color: theme.colors.white, fontSize: 11, fontWeight: '800', marginBottom: 7, marginTop: 8 },
  field: { backgroundColor: theme.colors.surfaceRaised, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.sm, padding: 14 },
  fieldText: { color: theme.colors.muted, fontSize: 13 },
  estimateButton: { backgroundColor: theme.colors.cyan, borderRadius: theme.radius.sm, padding: 15, marginTop: 16, alignItems: 'center' },
  estimateButtonText: { color: '#001217', fontWeight: '900' },
  sectionTitle: { color: theme.colors.white, fontSize: 22, fontWeight: '900', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vehicleCard: { width: '48%', minHeight: 150, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 15, overflow: 'hidden' },
  vehicleGlow: { position: 'absolute', width: 90, height: 90, borderRadius: 90, backgroundColor: '#073B50', top: -35, right: -25, opacity: 0.7 },
  vehicleName: { color: theme.colors.white, fontWeight: '900', fontSize: 15, marginTop: 55 },
  vehicleDetail: { color: theme.colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  vehicleMeta: { color: theme.colors.cyan, fontSize: 12, fontWeight: '800', marginTop: 10 },
  marketsCard: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 16, marginTop: 28, marginBottom: 16 },
  marketRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.border },
  marketCopy: { flex: 1 },
  marketName: { color: theme.colors.white, fontWeight: '900', fontSize: 14 },
  marketAreas: { color: theme.colors.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  marketStatus: { color: theme.colors.cyan, fontWeight: '800', fontSize: 10, maxWidth: 90, textAlign: 'right' },
  safetyCard: { backgroundColor: '#05121B', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 20 },
  sectionHero: { color: theme.colors.white, fontSize: 30, lineHeight: 31, fontWeight: '900', letterSpacing: -0.8 },
  linkText: { color: theme.colors.cyan, fontSize: 13, fontWeight: '900', marginTop: 18 },
  legalButton: { alignItems: 'center', paddingVertical: 18 },
  legalText: { color: theme.colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
});
