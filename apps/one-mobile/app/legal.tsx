import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../src/theme';

const links = [
  { label: 'Privacy Policy', url: 'https://blackonetransportation.com/privacy.html' },
  { label: 'Terms of Service', url: 'https://blackonetransportation.com/terms.html' },
  { label: 'Delete Account / Data Request', url: 'https://blackonetransportation.com/delete-account.html' },
  { label: 'Payment Help', url: 'https://blackonetransportation.com/payment-success.html' },
];

export default function LegalScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>ONE SUPPORT</Text>
        <Text style={styles.title}>Help & legal</Text>
        <Text style={styles.sub}>
          Review ONE policies, account-data information and support resources.
        </Text>

        <View style={styles.card}>
          {links.map((item) => (
            <Pressable
              key={item.label}
              style={styles.row}
              onPress={() => Linking.openURL(item.url)}
              accessibilityRole="link"
            >
              <Text style={styles.rowText}>{item.label}</Text>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Emergency situations</Text>
          <Text style={styles.noticeText}>
            ONE support is not a replacement for emergency services. Contact local emergency services when immediate help is required.
          </Text>
        </View>
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
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 17, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  rowText: { color: theme.colors.white, fontWeight: '800' },
  arrow: { color: theme.colors.cyan, fontWeight: '900', fontSize: 18 },
  notice: { backgroundColor: theme.colors.surfaceRaised, borderRadius: theme.radius.md, padding: 16, marginTop: 18 },
  noticeTitle: { color: theme.colors.white, fontWeight: '900' },
  noticeText: { color: theme.colors.muted, lineHeight: 20, marginTop: 6 },
});
