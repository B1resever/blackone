import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadCustomerTerms, acceptCustomerTerms, type CustomerTerms } from '../src/auth-client';
import { useAuth } from '../src/auth-context';
import { theme } from '../src/theme';

function documentText(html: string) {
  return html.replace(/<head>[\s\S]*?<\/head>/gi, '').replace(/<\/(p|h1|h2)>/gi, '\n\n').replace(/<[^>]+>/g, '').trim();
}
export default function CustomerTermsScreen() {
  const { user } = useAuth();
  const [terms, setTerms] = useState<CustomerTerms | null>(null);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [reading, setReading] = useState(false);
  useEffect(() => { let active = true;
    loadCustomerTerms().then(t => { if (active) setTerms(t); }).catch(() => { if (active) setMessage('Unable to load terms. / No se pudieron cargar las condiciones.'); });
    return () => { active = false; };
  }, []);
  async function accept() {
    if (!terms || !checked || busy || !user) return;
    setBusy(true); setMessage('');
    try { await acceptCustomerTerms(terms); setTerms(await loadCustomerTerms()); setChecked(false); }
    catch { setMessage('Acceptance was not confirmed. Reload and review the current terms. / No se confirmó la aceptación. Volvé a cargar las condiciones vigentes.'); }
    finally { setBusy(false); }
  }
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <ScrollView contentContainerStyle={{ padding: 24, gap: 18 }}>
      <Text style={{ fontSize: 28, color: theme.colors.text, fontWeight: '900' }}>B1 · Customer terms / Condiciones</Text>
      <Text>One acceptance per account and document version, across devices. Your account email, phone, server time and network IP are recorded with a copy of these documents. / Una aceptación por cuenta y versión, válida entre dispositivos. Se registran correo, teléfono, fecha, IP y copia de los documentos.</Text>
      <Pressable accessibilityRole="button" onPress={() => setReading(!reading)}><Text style={{ color: theme.colors.cyan }}>Read terms and privacy / Leer condiciones y privacidad</Text></Pressable>
      {reading && terms ? <View><Text selectable>{documentText(terms.documents.termsHtml)}</Text><Text selectable>{documentText(terms.documents.privacyHtml)}</Text></View> : null}
      {terms?.acceptance?.accepted ? <Text>Accepted / Aceptado: {terms.acceptance.acceptedAt}</Text> : <>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} disabled={!terms || busy} onPress={() => setChecked(!checked)}>
          <Text>{checked ? '☑' : '☐'} I accept B1 customer terms and acknowledge the privacy policy. / Acepto las condiciones de B1 y declaro haber recibido la política de privacidad.</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={!terms || !checked || busy || !user} onPress={accept} style={{ padding: 16, backgroundColor: theme.colors.cyan, opacity: !checked || busy ? 0.5 : 1 }}>
          <Text>ACCEPT / ACEPTAR</Text>
        </Pressable>
      </>}
      {!user ? <Pressable onPress={() => router.push('/account')}><Text>Sign in to your account / Ingresar a tu cuenta</Text></Pressable> : null}
      {message ? <Text accessibilityRole="alert">{message}</Text> : null}
      <Pressable onPress={() => router.back()}><Text>Back / Volver</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}
