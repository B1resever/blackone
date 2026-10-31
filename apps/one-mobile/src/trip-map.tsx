import { StyleSheet, Text, View } from 'react-native';
import type { TripLocation } from './auth-client';

export type TripMapProps = { location: TripLocation; fresh: boolean };

export default function TripMap({ fresh }: TripMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{fresh ? 'Driver location received' : 'Last known driver location'}</Text>
      <Text style={styles.message}>Use the map button below to open the actual coordinates. An embedded native map is available in the iPhone app and configured Android builds.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 22, backgroundColor: '#F3F8FC', borderRadius: 18, gap: 10 },
  title: { color: '#122536', fontSize: 18, fontWeight: '800' },
  message: { color: '#526473', lineHeight: 21 },
});
