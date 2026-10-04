import { useState } from 'react';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/auth-context';
import { theme } from '../src/theme';
import { enableOneNotifications } from '../src/push';

type Mode = 'login' | 'register';

export default function AccountScreen() {
  const { user, loading, login, register, logout, deleteMe } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  async function submit() {
    if (working) return;
    setWorking(true);
    setMessage('');

    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        });
      }
      setPassword('');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setMessage(
        code === 'account_exists'
          ? 'An ONE account already exists with this email.'
          : code === 'invalid_credentials'
            ? 'Email or password is incorrect.'
            : 'ONE could not complete the account request.',
      );
    } finally {
      setWorking(false);
    }
  }

  async function recoverAccount() {
    const address = 'reservations@blackonetransportation.com';
    const subject = encodeURIComponent('ONE Account Recovery');
    const body = encodeURIComponent('I need help recovering my ONE account.\n\nAccount email: ' + email.trim() + '\n\nDo not include your password in this message.');
    await Linking.openURL('mailto:' + address + '?subject=' + subject + '&body=' + body);
  }

  async function enableNotifications() {
    if (working) return;
    setWorking(true);
    setMessage('');
    try {
      const result = await enableOneNotifications();
      setMessage(result.enabled ? 'ONE trip notifications are enabled.' : 'Notifications could not be enabled on this device yet.');
    } catch {
      setMessage('ONE could not enable notifications.');
    } finally {
      setWorking(false);
    }
  }

  async function removeAccount() {
    if (working) return;
    setWorking(true);
    setMessage('');
    try {
      const result = await deleteMe();
      setMessage(result);
    } catch {
      setMessage('ONE could not delete the account at this time.');
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.loading}>Loading ONE account…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (user) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>MY ONE</Text>
          <Text style={styles.title}>Welcome, {user.fullName}.</Text>
          <Text style={styles.sub}>Your ONE account can be used across supported devices and operating markets.</Text>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>ACCOUNT</Text>
            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.meta}>{user.email}</Text>
            <Text style={styles.meta}>{user.phone}</Text>
            <Text style={styles.role}>{user.role.toUpperCase()}</Text>
          </View>

          {user.role === 'passenger' ? (
            <Pressable style={styles.primary} onPress={() => router.push('/trips')}>
              <Text style={styles.primaryText}>MY RESERVATIONS →</Text>
            </Pressable>
          ) : null}

          {user.role === 'driver' ? (
            <Pressable style={styles.primary} onPress={() => router.push('/driver-access')}>
              <Text style={styles.primaryText}>DRIVER TRIPS →</Text>
            </Pressable>
          ) : null}

          <Pressable style={styles.secondary} onPress={enableNotifications} disabled={working}>
            <Text style={styles.secondaryText}>ENABLE TRIP NOTIFICATIONS</Text>
          </Pressable>

          <Pressable style={styles.secondary} onPress={logout} disabled={working}>
            <Text style={styles.secondaryText}>SIGN OUT</Text>
          </Pressable>

          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>Delete ONE account</Text>
            <Text style={styles.dangerText}>
              This permanently disables your account and removes personal profile data that is not required to be retained for legal, financial, fraud-prevention or safety obligations.
            </Text>
            <Pressable style={styles.dangerButton} onPress={removeAccount} disabled={working}>
              <Text style={styles.dangerButtonText}>{working ? 'PROCESSING…' : 'DELETE MY ACCOUNT'}</Text>
            </Pressable>
          </View>

          {message ? <Text style={styles.message}>{message}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const registerMode = mode === 'register';
  const canSubmit =
    email.includes('@') &&
    password.length >= (registerMode ? 10 : 1) &&
    (!registerMode || (fullName.trim().length > 2 && phone.trim().length >= 7));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>MY ONE</Text>
        <Text style={styles.title}>{registerMode ? 'Create your ONE.' : 'Welcome back.'}</Text>
        <Text style={styles.sub}>
          {registerMode
            ? 'Create a passenger account for faster reservations and synchronized access.'
            : 'Sign in to your ONE account.'}
        </Text>

        <View style={styles.segment}>
          <Pressable style={[styles.segmentButton, mode === 'login' ? styles.segmentActive : null]} onPress={() => setMode('login')}>
            <Text style={[styles.segmentText, mode === 'login' ? styles.segmentTextActive : null]}>SIGN IN</Text>
          </Pressable>
          <Pressable style={[styles.segmentButton, mode === 'register' ? styles.segmentActive : null]} onPress={() => setMode('register')}>
            <Text style={[styles.segmentText, mode === 'register' ? styles.segmentTextActive : null]}>CREATE ACCOUNT</Text>
          </Pressable>
        </View>

        {registerMode ? (
          <>
            <Text style={styles.label}>Full name</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full name" placeholderTextColor={theme.colors.muted} autoComplete="name" />

            <Text style={styles.label}>Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+1 ..." placeholderTextColor={theme.colors.muted} keyboardType="phone-pad" autoComplete="tel" />
          </>
        ) : null}

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="name@email.com" placeholderTextColor={theme.colors.muted} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder={registerMode ? 'At least 10 characters' : 'Password'} placeholderTextColor={theme.colors.muted} secureTextEntry autoComplete={registerMode ? 'new-password' : 'current-password'} />

        <Pressable style={[styles.primary, !canSubmit || working ? styles.disabled : null]} disabled={!canSubmit || working} onPress={submit}>
          <Text style={styles.primaryText}>{working ? 'PLEASE WAIT…' : registerMode ? 'CREATE MY ONE →' : 'SIGN IN →'}</Text>
        </Pressable>

        {!registerMode ? (
          <Pressable style={styles.recoveryButton} onPress={recoverAccount}>
            <Text style={styles.recoveryText}>FORGOT PASSWORD? CONTACT ONE SUPPORT</Text>
          </Pressable>
        ) : null}

        {message ? <Text style={styles.message}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 44 },
  loading: { color: theme.colors.muted, fontWeight: '700' },
  kicker: { color: theme.colors.cyan, fontSize: 12, fontWeight: '900', letterSpacing: 2.2 },
  title: { color: theme.colors.white, fontSize: 34, fontWeight: '900', marginTop: 8 },
  sub: { color: theme.colors.muted, lineHeight: 21, marginTop: 10, marginBottom: 20 },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 18 },
  cardLabel: { color: theme.colors.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  name: { color: theme.colors.white, fontSize: 22, fontWeight: '900', marginTop: 10 },
  meta: { color: theme.colors.muted, marginTop: 5 },
  role: { color: theme.colors.cyanSoft, fontWeight: '900', marginTop: 12 },
  segment: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  segmentButton: { flex: 1, paddingVertical: 12, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
  segmentActive: { backgroundColor: theme.colors.cyan, borderColor: theme.colors.cyan },
  segmentText: { color: theme.colors.muted, fontWeight: '900', fontSize: 11 },
  segmentTextActive: { color: '#001217' },
  label: { color: theme.colors.white, fontSize: 12, fontWeight: '800', marginBottom: 8, marginTop: 14 },
  input: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1, borderRadius: theme.radius.md, color: theme.colors.white, paddingHorizontal: 16, paddingVertical: 15, fontSize: 15 },
  primary: { backgroundColor: theme.colors.cyan, borderRadius: theme.radius.md, padding: 17, marginTop: 20, alignItems: 'center' },
  primaryText: { color: '#001217', fontWeight: '900' },
  recoveryButton: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  recoveryText: { color: theme.colors.goldSoft, fontWeight: '900', fontSize: 10, letterSpacing: 0.7, textAlign: 'center' },
  secondary: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 15, alignItems: 'center', marginTop: 16 },
  secondaryText: { color: theme.colors.white, fontWeight: '900' },
  disabled: { opacity: 0.35 },
  message: { color: theme.colors.cyanSoft, textAlign: 'center', marginTop: 15, fontWeight: '700' },
  dangerCard: { borderWidth: 1, borderColor: theme.colors.danger, borderRadius: theme.radius.lg, padding: 18, marginTop: 28 },
  dangerTitle: { color: theme.colors.white, fontWeight: '900', fontSize: 17 },
  dangerText: { color: theme.colors.muted, lineHeight: 20, marginTop: 7 },
  dangerButton: { borderWidth: 1, borderColor: theme.colors.danger, borderRadius: theme.radius.md, padding: 14, alignItems: 'center', marginTop: 15 },
  dangerButtonText: { color: theme.colors.danger, fontWeight: '900' },
});
