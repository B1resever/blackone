import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme } from './theme';

type Suggestion = {
  id: string;
  label: string;
  mainText: string;
  secondaryText: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  marketId: 'south-florida' | 'buenos-aires';
  placeholder: string;
};

export function LocationInput({ value, onChange, marketId, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = value.trim();
    const base = process.env.EXPO_PUBLIC_ONE_API_URL?.trim().replace(/\/$/, '');

    if (!focused || !base || trimmed.length < 3) {
      setSuggestions([]);
      return;
    }

    const current = ++requestId.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(base + '/one/api/places', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: trimmed, marketId }),
        });

        if (!response.ok) {
          if (current === requestId.current) setSuggestions([]);
          return;
        }

        const data = (await response.json()) as { suggestions?: Suggestion[] };
        if (current === requestId.current) setSuggestions(data.suggestions ?? []);
      } catch {
        if (current === requestId.current) setSuggestions([]);
      } finally {
        if (current === requestId.current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, marketId, focused]);

  function choose(suggestion: Suggestion) {
    onChange(suggestion.label);
    setSuggestions([]);
    setFocused(false);
  }

  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        style={styles.input}
        autoComplete="street-address"
        returnKeyType="next"
        onFocus={() => setFocused(true)}
      />

      {focused && (loading || suggestions.length > 0) ? (
        <View style={styles.results}>
          {loading ? <Text style={styles.loading}>Searching places…</Text> : null}
          {!loading
            ? suggestions.map((suggestion) => (
                <Pressable
                  key={suggestion.id}
                  style={styles.row}
                  onPress={() => choose(suggestion)}
                  accessibilityRole="button"
                >
                  <Text style={styles.main}>{suggestion.mainText}</Text>
                  {suggestion.secondaryText ? (
                    <Text style={styles.secondary}>{suggestion.secondaryText}</Text>
                  ) : null}
                </Pressable>
              ))
            : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    color: theme.colors.white,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
  },
  results: {
    backgroundColor: theme.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    marginTop: 6,
    overflow: 'hidden',
  },
  loading: { color: theme.colors.muted, padding: 13, fontSize: 12 },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  main: { color: theme.colors.white, fontWeight: '800' },
  secondary: { color: theme.colors.muted, fontSize: 12, marginTop: 3 },
});
