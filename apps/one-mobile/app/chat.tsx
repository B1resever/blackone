import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadTripMessages, sendTripMessage, TripMessage, OneUser } from '../src/auth-client';
import { useAuth } from '../src/auth-context';
import { mergeTripMessages } from '../src/trip-messages-state';
import { theme } from '../src/theme';

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? '';
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{ requestCode?: string }>();
  const requestCode = readParam(params.requestCode);
  const { user } = useAuth();
  return <ChatContent key={JSON.stringify([requestCode, user?.id])} requestCode={requestCode} user={user} />;
}

function ChatContent({ requestCode, user }: { requestCode: string; user: OneUser | null }) {
  const [messages, setMessages] = useState<TripMessage[]>([]);
  const [body, setBody] = useState('');
  const [working, setWorking] = useState(false);
  const [closed, setClosed] = useState(false);
  const [status, setStatus] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('');
  const session = useRef<AbortController | null>(null);
  const pendingSend = useRef(false);
  const canChat = Boolean(requestCode && user && ['passenger', 'driver'].includes(user.role));

  useEffect(() => {
    if (!canChat) {
      setStatus(user ? 'Open chat from an assigned trip.' : 'Sign in to My ONE to open your trip chat.');
      return;
    }
    const controller = new AbortController();
    session.current = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      let retry = true;
      try {
        const next = await loadTripMessages(requestCode, controller.signal);
        if (!controller.signal.aborted) {
          setMessages((current) => mergeTripMessages(current, next));
          setConnectionMessage('');
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        const code = error instanceof Error ? error.message : '';
        if (code === 'trip_messages_access_denied' || code === 'trip_not_found') {
          setMessages([]);
          setBody('');
          setClosed(true);
          setStatus('This trip chat is unavailable for the current account.');
          retry = false;
        } else setConnectionMessage('Connection interrupted. ONE will try loading messages again.');
      } finally {
        if (!controller.signal.aborted && retry) timer = setTimeout(() => void poll(), 4000);
      }
    }
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [canChat, requestCode, user?.id]);

  async function send() {
    const text = body.trim();
    const controller = session.current;
    if (!text || pendingSend.current || !canChat || closed || !controller || controller.signal.aborted) return;
    pendingSend.current = true;
    setWorking(true);
    try {
      const message = await sendTripMessage(requestCode, text, controller.signal);
      if (controller.signal.aborted) return;
      setMessages((current) => mergeTripMessages(current, [message]));
      setBody((current) => current.trim() === text ? '' : current);
      setStatus('');
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error instanceof Error && error.message === 'trip_chat_closed') {
        setClosed(true);
        setStatus('This trip is closed. New messages cannot be sent.');
      } else setStatus('Message delivery could not be confirmed. Check the conversation before sending it again.');
    } finally {
      pendingSend.current = false;
      if (!controller.signal.aborted) setWorking(false);
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
        {status || connectionMessage ? <Text style={styles.status}>{status || connectionMessage}</Text> : null}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Message your ONE driver/passenger..."
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
          editable={canChat && !closed}
          multiline
          maxLength={1000}
        />
        <Pressable accessibilityRole="button" style={[styles.send, !body.trim() || working || !canChat || closed ? styles.disabled : null]} onPress={send} disabled={!body.trim() || working || !canChat || closed}>
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
  title: { color: theme.colors.text, fontSize: 22, fontWeight: '900', marginTop: 5 },
  sub: { color: theme.colors.muted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  messages: { padding: 16, paddingBottom: 30 },
  empty: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 18 },
  emptyTitle: { color: theme.colors.text, fontWeight: '900' },
  emptyText: { color: theme.colors.muted, marginTop: 5, fontSize: 12 },
  bubble: { maxWidth: '84%', padding: 12, borderRadius: 16, marginBottom: 9, borderWidth: 1 },
  mine: { alignSelf: 'flex-end', backgroundColor: theme.colors.selected, borderColor: theme.colors.gold },
  theirs: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
  sender: { color: theme.colors.goldSoft, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  body: { color: theme.colors.text, fontSize: 14, lineHeight: 19, marginTop: 4 },
  time: { color: theme.colors.muted, fontSize: 9, marginTop: 5, textAlign: 'right' },
  status: { color: theme.colors.muted, textAlign: 'center', marginTop: 12 },
  composer: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface },
  input: { flex: 1, maxHeight: 100, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, color: theme.colors.text },
  send: { alignSelf: 'flex-end', backgroundColor: theme.colors.gold, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12 },
  sendText: { color: theme.colors.onAccent, fontWeight: '900', fontSize: 11 },
  disabled: { opacity: 0.35 },
});
