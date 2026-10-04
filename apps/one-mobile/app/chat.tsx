import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadTripMessages, sendTripMessage, TripMessage } from '../src/auth-client';
import { useAuth } from '../src/auth-context';
import { theme } from '../src/theme';

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{ requestCode?: string }>();
  const requestCode = readParam(params.requestCode);
  const { user } = useAuth();
  const [messages, setMessages] = useState<TripMessage[]>([]);
  const [body, setBody] = useState('');
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState('');

  async function refresh() {
    if (!requestCode) return;
    try {
      setMessages(await loadTripMessages(requestCode));
      setStatus('');
    } catch {
      setStatus('ONE could not load trip messages.');
    }
  }

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 4000);
    return () => clearInterval(timer);
  }, [requestCode]);

  async function send() {
    const text = body.trim();
    if (!text || working || !requestCode) return;
    setWorking(true);
    try {
      const message = await sendTripMessage(requestCode, text);
      setMessages((current) => [...current, message]);
      setBody('');
      setStatus('');
    } catch {
      setStatus('Message could not be sent.');
    } finally {
      setWorking(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.kicker}>SECURE TRIP CHAT</Text>
        <Text style={styles.title}>{requestCode || 'ONE TRIP'}</Text>
        <Text style={styles.sub}>Messages are limited to the signed-in passenger and assigned ONE driver.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
        {messages.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No messages yet.</Text>
            <Text style={styles.emptyText}>Use this chat for pickup and trip coordination.</Text>
          </View>
        ) : null}

        {messages.map((message) => {
          const mine = message.sender_user_id === user?.id;
          return (
            <View key={message.id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
              <Text style={styles.sender}>{mine ? 'YOU' : message.sender_name}</Text>
              <Text style={styles.body}>{message.body}</Text>
              <Text style={styles.time}>{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          );
        })}
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Message your ONE driver/passenger..."
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
          multiline
          maxLength={1000}
        />
        <Pressable style={[styles.send, !body.trim() || working ? styles.disabled : null]} onPress={send} disabled={!body.trim() || working}>
          <Text style={styles.sendText}>{working ? '…' : 'SEND'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  kicker: { color: theme.colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: theme.colors.white, fontSize: 22, fontWeight: '900', marginTop: 5 },
  sub: { color: theme.colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  messages: { padding: 16, paddingBottom: 30 },
  empty: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 18 },
  emptyTitle: { color: theme.colors.white, fontWeight: '900' },
  emptyText: { color: theme.colors.muted, marginTop: 5, fontSize: 12 },
  bubble: { maxWidth: '84%', padding: 12, borderRadius: 16, marginBottom: 9, borderWidth: 1 },
  mine: { alignSelf: 'flex-end', backgroundColor: '#2A2012', borderColor: theme.colors.gold },
  theirs: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  sender: { color: theme.colors.goldSoft, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  body: { color: theme.colors.white, fontSize: 14, lineHeight: 19, marginTop: 4 },
  time: { color: theme.colors.muted, fontSize: 9, marginTop: 5, textAlign: 'right' },
  status: { color: theme.colors.muted, textAlign: 'center', marginTop: 12 },
  composer: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: '#04090C' },
  input: { flex: 1, maxHeight: 100, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.white },
  send: { alignSelf: 'flex-end', backgroundColor: theme.colors.gold, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12 },
  sendText: { color: '#16100A', fontWeight: '900', fontSize: 11 },
  disabled: { opacity: 0.35 },
});
