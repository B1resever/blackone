import { useEffect, useRef } from 'react';
import Constants from 'expo-constants';
import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import type { TripMapProps } from './trip-map';

export default function TripMap({ location, fresh }: TripMapProps) {
  const map = useRef<MapView>(null);
  const enabled = Platform.OS === 'ios' || Constants.expoConfig?.extra?.oneAndroidMapsConfigured === true;
  const { latitude, longitude } = location;

  useEffect(() => {
    if (enabled) map.current?.animateCamera({ center: { latitude, longitude } }, { duration: 500 });
  }, [enabled, latitude, longitude]);

  if (!enabled) {
    return (
      <View style={styles.unavailable}>
        <Text style={styles.title}>Driver coordinates received</Text>
        <Text style={styles.message}>The embedded Android map is not available in this build. Open the actual position with the map button below.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={map}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude, longitude, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
        userInterfaceStyle="light"
        showsUserLocation={false}
        accessibilityLabel={fresh ? 'Map of driver location' : 'Map of last known driver location'}
      >
        <Marker coordinate={{ latitude, longitude }} title={fresh ? 'B1 driver' : 'Last known position'} pinColor="#005BEA" />
        {typeof location.accuracy_meters === 'number' && location.accuracy_meters > 0 && location.accuracy_meters <= 10_000 ? (
          <Circle center={{ latitude, longitude }} radius={location.accuracy_meters} strokeColor="#005BEA" fillColor="rgba(0,91,234,0.08)" />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 300, overflow: 'hidden', borderRadius: 18, borderWidth: 1, borderColor: '#DCE3E8' },
  unavailable: { padding: 22, backgroundColor: '#F3F8FC', borderRadius: 18, gap: 10 },
  title: { color: '#122536', fontSize: 18, fontWeight: '800' },
  message: { color: '#526473', lineHeight: 21 },
});
